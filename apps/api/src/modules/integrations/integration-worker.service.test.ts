import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import test from "node:test";
import type { IntegrationStatus } from "@prisma/client";
import { PancakeAdapter } from "./adapters/pancake.adapter.js";
import { IntegrationAdapterRegistry } from "./integration-adapter.registry.js";
import { IntegrationWorkerService } from "./integration-worker.service.js";
import type { ClaimedIntegrationJob, IntegrationAdapter } from "./integration.types.js";
import type {
  IntegrationFailureUpdate,
  IntegrationJobStore,
} from "./repositories/integration-job.store.js";

class StaticRegistry extends IntegrationAdapterRegistry {
  constructor(private readonly adapter: IntegrationAdapter) {
    super();
  }

  override get(): IntegrationAdapter {
    return this.adapter;
  }
}

class InMemoryStore implements IntegrationJobStore {
  readonly jobs: StoreJob[];

  constructor(seed: Partial<ClaimedIntegrationJob> = {}) {
    this.jobs = [
      {
        id: "1",
        rawId: 1n,
        rawOrderId: 10n,
        integration: "pancake",
        action: "create",
        attemptCount: 0,
        externalId: null,
        locked: false,
        status: "pending",
        nextRetryAt: null,
        lastError: null,
        order: {
          orderCode: "OD001",
          recipientName: "Nguyen Van A",
          recipientPhoneMasked: "090****567",
          address: "1 Le Loi",
          province: "HCM",
          district: "Quan 1",
          ward: "Ben Nghe",
          totalQuantity: 1,
          subtotal: "100000",
          discountAmount: "25000",
          shippingFee: "0",
          totalAmount: "75000",
          paymentMethod: "cod",
          note: null,
          items: [],
        },
        ...seed,
      },
    ];
  }

  claimNextDueJob(): Promise<ClaimedIntegrationJob | null> {
    const job = this.jobs.find(
      (candidate) =>
        !candidate.locked &&
        (candidate.status === "pending" || candidate.status === "failed") &&
        (candidate.nextRetryAt === null || candidate.nextRetryAt <= new Date()),
    );
    if (!job) {
      return Promise.resolve(null);
    }
    job.locked = true;
    job.status = "processing";
    return Promise.resolve({ ...job });
  }

  markSuccess(job: ClaimedIntegrationJob, externalId: string): Promise<void> {
    const stored = this.mustFind(job.id);
    stored.status = "success";
    stored.externalId = externalId;
    stored.locked = false;
    stored.lastError = null;
    return Promise.resolve();
  }

  markFailure(job: ClaimedIntegrationJob, update: IntegrationFailureUpdate): Promise<void> {
    const stored = this.mustFind(job.id);
    stored.status = update.status;
    stored.attemptCount = update.attemptCount;
    stored.nextRetryAt = update.nextRetryAt;
    stored.lastError = update.errorMessage;
    stored.locked = false;
    return Promise.resolve();
  }

  release(job: ClaimedIntegrationJob): Promise<void> {
    this.mustFind(job.id).locked = false;
    return Promise.resolve();
  }

  list(): Promise<never[]> {
    return Promise.resolve([]);
  }

  retryNow(): Promise<never> {
    throw new Error("not needed");
  }

  getById(): Promise<null> {
    return Promise.resolve(null);
  }

  private mustFind(id: string) {
    const job = this.jobs.find((candidate) => candidate.id === id);
    assert.ok(job);
    return job;
  }
}

type StoreJob = ClaimedIntegrationJob & {
  locked: boolean;
  status: IntegrationStatus;
  nextRetryAt: Date | null;
  lastError: string | null;
};

async function withServer(
  handler: (request: IncomingMessage, response: ServerResponse) => void,
  run: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const server = createServer(handler);
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address === "object");
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}

function adapter(baseUrl: string): PancakeAdapter {
  return new PancakeAdapter({
    baseUrl,
    paths: {
      createOrder: "/orders",
    },
  });
}

function worker(adapterInstance: IntegrationAdapter): IntegrationWorkerService {
  return new IntegrationWorkerService(new StaticRegistry(adapterInstance), {} as never);
}

function firstJob(store: InMemoryStore): StoreJob {
  const job = store.jobs[0];
  assert.ok(job);
  return job;
}

void test("worker handles successful partner createOrder", async () => {
  await withServer(
    (_request, response) => {
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ externalId: "PX-1" }));
    },
    async (baseUrl) => {
      const store = new InMemoryStore();
      const result = await worker(adapter(baseUrl)).processOne(store);
      assert.equal(result, "success");
      assert.equal(firstJob(store).status, "success");
      assert.equal(firstJob(store).externalId, "PX-1");
    },
  );
});

void test("worker retries timeout and HTTP 5xx failures", async () => {
  process.env.API_INTEGRATION_TIMEOUT_SECONDS = "1";
  await withServer(
    (_request, response) => {
      setTimeout(() => {
        response.statusCode = 200;
        response.end(JSON.stringify({ externalId: "late" }));
      }, 1500);
    },
    async (baseUrl) => {
      const store = new InMemoryStore();
      await worker(adapter(baseUrl)).processOne(store);
      assert.equal(firstJob(store).status, "failed");
      assert.equal(firstJob(store).attemptCount, 1);
      assert.ok(firstJob(store).nextRetryAt);
    },
  );

  await withServer(
    (_request, response) => {
      response.statusCode = 500;
      response.end(JSON.stringify({ error: "temporary" }));
    },
    async (baseUrl) => {
      const store = new InMemoryStore();
      await worker(adapter(baseUrl)).processOne(store);
      assert.equal(firstJob(store).status, "failed");
    },
  );
  delete process.env.API_INTEGRATION_TIMEOUT_SECONDS;
});

void test("worker sends HTTP 4xx to manual review without retry", async () => {
  await withServer(
    (_request, response) => {
      response.statusCode = 400;
      response.end(JSON.stringify({ error: "bad payload", authorization: "Bearer secret" }));
    },
    async (baseUrl) => {
      const store = new InMemoryStore();
      await worker(adapter(baseUrl)).processOne(store);
      assert.equal(firstJob(store).status, "cancelled");
      assert.doesNotMatch(firstJob(store).lastError ?? "", /secret/);
    },
  );
});

void test("worker retries invalid partner response", async () => {
  await withServer(
    (_request, response) => {
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ ok: true }));
    },
    async (baseUrl) => {
      const store = new InMemoryStore();
      await worker(adapter(baseUrl)).processOne(store);
      assert.equal(firstJob(store).status, "failed");
      assert.match(firstJob(store).lastError ?? "", /externalId/);
    },
  );
});

void test("retry succeeds after a failed attempt becomes due", async () => {
  let calls = 0;
  await withServer(
    (_request, response) => {
      calls += 1;
      if (calls === 1) {
        response.statusCode = 500;
        response.end(JSON.stringify({ error: "temporary" }));
        return;
      }
      response.end(JSON.stringify({ externalId: "PX-RETRY" }));
    },
    async (baseUrl) => {
      const store = new InMemoryStore();
      const service = worker(adapter(baseUrl));
      await service.processOne(store);
      firstJob(store).nextRetryAt = new Date(Date.now() - 1);
      await service.processOne(store);
      assert.equal(firstJob(store).status, "success");
      assert.equal(firstJob(store).externalId, "PX-RETRY");
    },
  );
});

void test("concurrent workers cannot process the same locked job twice", async () => {
  let calls = 0;
  await withServer(
    (_request, response) => {
      calls += 1;
      setTimeout(() => {
        response.end(JSON.stringify({ externalId: "PX-LOCK" }));
      }, 50);
    },
    async (baseUrl) => {
      const store = new InMemoryStore();
      const service = worker(adapter(baseUrl));
      await Promise.all([service.processOne(store), service.processOne(store)]);
      assert.equal(calls, 1);
      assert.equal(firstJob(store).status, "success");
    },
  );
});

void test("partner already created order but client lost response is treated as success", async () => {
  await withServer(
    (_request, response) => {
      response.statusCode = 409;
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ externalId: "PX-EXISTS", message: "already exists" }));
    },
    async (baseUrl) => {
      const store = new InMemoryStore();
      await worker(adapter(baseUrl)).processOne(store);
      assert.equal(firstJob(store).status, "success");
      assert.equal(firstJob(store).externalId, "PX-EXISTS");
    },
  );
});
