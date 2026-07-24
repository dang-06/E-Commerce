"use client";

import { useEffect, useState, type SyntheticEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, EyeOff, Save } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { getErrorMessage, getErrorMessages, productService } from "@/lib/services/api-service";
import type { Product, ProductAttribute, ProductColorVariant } from "@/lib/types";
import { slugifyVietnamese } from "@/lib/utils/vietnamese";

const emptyVariant = (): ProductColorVariant => ({
  colorCode: "#f2d4d7",
  imageUrl: "",
  name: "",
  sku: "",
  sortOrder: 0,
});

const emptyAttribute = (): ProductAttribute => ({
  label: "",
  value: "",
});

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = String(params.id);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState("");
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [imageError, setImageError] = useState("");
  const [uploadingVariantIndex, setUploadingVariantIndex] = useState<number | null>(null);
  const [uploadingDetailImage, setUploadingDetailImage] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        setProduct(await productService.getProductById(productId));
      } finally {
        setLoading(false);
      }
    }
    void loadProduct();
  }, [productId]);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product) {
      return;
    }
    setSaving(true);
    setMessage("");
    setFormErrors([]);
    try {
      const normalizedProduct = {
        ...product,
        slug: slugifyVietnamese(product.slug || product.name),
        colorVariants: product.colorVariants.map((variant, index) => ({
          ...variant,
          sortOrder: index,
        })),
      };
      await productService.updateProduct(product.id, normalizedProduct);
      setProduct(normalizedProduct);
      setMessage("Đã lưu sản phẩm.");
    } catch (error) {
      setFormErrors(getErrorMessages(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(file: File | undefined) {
    if (!file || !product) {
      return;
    }
    setUploadingImage(true);
    setImageError("");
    try {
      const uploaded = await productService.uploadProductImage(file);
      setProduct({ ...product, image: uploaded.imageUrl });
    } catch (error) {
      console.error(error);
      setImageError(getErrorMessage(error));
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleVariantImageUpload(index: number, file: File | undefined) {
    if (!file || !product) {
      return;
    }
    setUploadingVariantIndex(index);
    setImageError("");
    try {
      const uploaded = await productService.uploadProductImage(file);
      setProduct({
        ...product,
        colorVariants: product.colorVariants.map((variant, variantIndex) =>
          variantIndex === index ? { ...variant, imageUrl: uploaded.imageUrl } : variant,
        ),
      });
    } catch (error) {
      setImageError(getErrorMessage(error));
    } finally {
      setUploadingVariantIndex(null);
    }
  }

  async function handleDetailImageUpload(file: File | undefined) {
    if (!file || !product) {
      return;
    }
    setUploadingDetailImage(true);
    setImageError("");
    try {
      const uploaded = await productService.uploadProductImage(file);
      setProduct({
        ...product,
        detailImageUrls: [...product.detailImageUrls, uploaded.imageUrl],
      });
    } catch (error) {
      setImageError(getErrorMessage(error));
    } finally {
      setUploadingDetailImage(false);
    }
  }

  function updateAttribute(index: number, updates: Partial<ProductAttribute>) {
    if (!product) {
      return;
    }
    setProduct({
      ...product,
      productAttributes: product.productAttributes.map((attribute, attributeIndex) =>
        attributeIndex === index ? { ...attribute, ...updates } : attribute,
      ),
    });
  }

  function updateVariant(index: number, updates: Partial<ProductColorVariant>) {
    if (!product) {
      return;
    }
    setProduct({
      ...product,
      colorVariants: product.colorVariants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, ...updates, sortOrder: index } : variant,
      ),
    });
  }

  if (loading) {
    return <div className="p-6 text-muted-foreground">Đang tải sản phẩm...</div>;
  }

  if (!product) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-destructive">Không tìm thấy sản phẩm.</p>
        <Link href="/admin/products">
          <Button>Quay lại</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Breadcrumbs
        items={[
          { label: "Tổng quan", href: "/admin" },
          { label: "Sản phẩm", href: "/admin/products" },
          { label: product.name },
        ]}
      />

      <div className="flex items-center gap-3">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sửa sản phẩm</h1>
          <p className="text-muted-foreground">{product.sku}</p>
        </div>
      </div>

      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}
      {formErrors.length > 0 ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <p className="font-semibold">Không thể lưu sản phẩm. Vui lòng kiểm tra lại:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {formErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <form
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        className="grid gap-6 lg:grid-cols-3"
      >
        <Card className="space-y-4 p-6 lg:col-span-2">
          <div>
            <Label htmlFor="name">Tên sản phẩm</Label>
            <Input
              id="name"
              value={product.name}
              onChange={(event) => {
                setProduct({ ...product, name: event.target.value });
              }}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={product.sku}
                onChange={(event) => {
                  setProduct({ ...product, sku: event.target.value });
                }}
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={product.slug}
                onChange={(event) => {
                  setProduct({ ...product, slug: slugifyVietnamese(event.target.value) });
                }}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Chỉ dùng chữ thường, số và dấu gạch ngang.
              </p>
            </div>
          </div>
          <div>
            <Label htmlFor="description">Mô tả chi tiết</Label>
            <Textarea
              id="description"
              rows={5}
              value={product.description}
              onChange={(event) => {
                setProduct({ ...product, description: event.target.value });
              }}
            />
          </div>
          <div className="space-y-4 rounded-lg border border-border p-4">
            <h2 className="text-lg font-semibold">Dữ liệu chi tiết kiểu 1688</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="sellerName">Tên nhà bán</Label>
                <Input
                  id="sellerName"
                  value={product.sellerName}
                  onChange={(event) => {
                    setProduct({ ...product, sellerName: event.target.value });
                  }}
                />
              </div>
              <div>
                <Label htmlFor="sellerYears">Số năm hoạt động</Label>
                <Input
                  id="sellerYears"
                  type="number"
                  min={0}
                  max={100}
                  value={product.sellerYears ?? ""}
                  onChange={(event) => {
                    setProduct({
                      ...product,
                      sellerYears: event.target.value ? Number(event.target.value) : undefined,
                    });
                  }}
                />
              </div>
              <div>
                <Label htmlFor="sellerPrimaryCategory">Ngành hàng chính</Label>
                <Input
                  id="sellerPrimaryCategory"
                  value={product.sellerPrimaryCategory}
                  onChange={(event) => {
                    setProduct({ ...product, sellerPrimaryCategory: event.target.value });
                  }}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="minimumOrderQuantity">Số lượng đặt tối thiểu</Label>
                <Input
                  id="minimumOrderQuantity"
                  type="number"
                  min={1}
                  value={product.minimumOrderQuantity}
                  onChange={(event) => {
                    setProduct({
                      ...product,
                      minimumOrderQuantity: Number(event.target.value || 1),
                    });
                  }}
                />
              </div>
              <div>
                <Label htmlFor="shippingOrigin">Nơi gửi hàng</Label>
                <Input
                  id="shippingOrigin"
                  value={product.shippingOrigin}
                  onChange={(event) => {
                    setProduct({ ...product, shippingOrigin: event.target.value });
                  }}
                />
              </div>
              <div>
                <Label htmlFor="shippingLeadTime">Cam kết giao hàng</Label>
                <Input
                  id="shippingLeadTime"
                  value={product.shippingLeadTime}
                  onChange={(event) => {
                    setProduct({ ...product, shippingLeadTime: event.target.value });
                  }}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="returnPolicy">Chính sách nổi bật</Label>
              <Input
                id="returnPolicy"
                value={product.returnPolicy}
                onChange={(event) => {
                  setProduct({ ...product, returnPolicy: event.target.value });
                }}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="reviewRating">Điểm đánh giá</Label>
                <Input
                  id="reviewRating"
                  type="number"
                  min={0}
                  max={5}
                  step="0.1"
                  value={product.reviewRating ?? ""}
                  onChange={(event) => {
                    setProduct({
                      ...product,
                      reviewRating: event.target.value ? Number(event.target.value) : undefined,
                    });
                  }}
                />
              </div>
              <div>
                <Label htmlFor="reviewCount">Số đánh giá</Label>
                <Input
                  id="reviewCount"
                  type="number"
                  min={0}
                  value={product.reviewCount ?? ""}
                  onChange={(event) => {
                    setProduct({
                      ...product,
                      reviewCount: event.target.value ? Number(event.target.value) : undefined,
                    });
                  }}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="reviewTagsText">Thẻ đánh giá</Label>
              <Textarea
                id="reviewTagsText"
                rows={3}
                value={formatAttributeLines(product.reviewTags)}
                onChange={(event) => {
                  setProduct({ ...product, reviewTags: parseAttributeLines(event.target.value) });
                }}
              />
            </div>
            <div>
              <Label htmlFor="reviewImageUrlsText">Ảnh đánh giá</Label>
              <Textarea
                id="reviewImageUrlsText"
                rows={3}
                placeholder={"https://cdn.example.com/review-1.jpg\n/products/review-2.jpg"}
                value={product.reviewImageUrls.join("\n")}
                onChange={(event) => {
                  setProduct({
                    ...product,
                    reviewImageUrls: parseUrlLines(event.target.value),
                  });
                }}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Mỗi dòng là một URL http(s) hoặc đường dẫn public bắt đầu bằng /.
              </p>
            </div>
            <div>
              <Label htmlFor="qualityCertificationsText">Chứng nhận chất lượng</Label>
              <Textarea
                id="qualityCertificationsText"
                rows={3}
                value={formatAttributeLines(product.qualityCertifications)}
                onChange={(event) => {
                  setProduct({
                    ...product,
                    qualityCertifications: parseAttributeLines(event.target.value),
                  });
                }}
              />
            </div>
            <div>
              <Label htmlFor="packagingAttributesText">Đóng gói</Label>
              <Textarea
                id="packagingAttributesText"
                rows={3}
                value={formatAttributeLines(product.packagingAttributes)}
                onChange={(event) => {
                  setProduct({
                    ...product,
                    packagingAttributes: parseAttributeLines(event.target.value),
                  });
                }}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="listedPrice">Giá niêm yết</Label>
              <Input
                id="listedPrice"
                type="number"
                value={product.listedPrice}
                onChange={(event) => {
                  setProduct({ ...product, listedPrice: Number(event.target.value) });
                }}
              />
            </div>
            <div>
              <Label htmlFor="discountAmount">Giảm giá</Label>
              <Input
                id="discountAmount"
                type="number"
                value={product.discountAmount}
                onChange={(event) => {
                  setProduct({ ...product, discountAmount: Number(event.target.value) });
                }}
              />
            </div>
          </div>
          <div className="space-y-4 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Thông số sản phẩm</h2>
                <p className="text-sm text-muted-foreground">
                  Hiển thị như bảng thuộc tính trên trang chi tiết.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setProduct({
                    ...product,
                    productAttributes: [...product.productAttributes, emptyAttribute()],
                  });
                }}
              >
                Thêm thông số
              </Button>
            </div>
            {product.productAttributes.length === 0 ? (
              <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                Chưa có thông số nào.
              </p>
            ) : null}
            {product.productAttributes.map((attribute, index) => (
              <div
                key={index}
                className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]"
              >
                <div>
                  <Label htmlFor={`attribute-label-${index}`}>Tên thông số</Label>
                  <Input
                    id={`attribute-label-${index}`}
                    value={attribute.label}
                    onChange={(event) => {
                      updateAttribute(index, { label: event.target.value });
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor={`attribute-value-${index}`}>Giá trị</Label>
                  <Input
                    id={`attribute-value-${index}`}
                    value={attribute.value}
                    onChange={(event) => {
                      updateAttribute(index, { value: event.target.value });
                    }}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      setProduct({
                        ...product,
                        productAttributes: product.productAttributes.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      });
                    }}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <Label htmlFor="product-image">Ảnh sản phẩm</Label>
            {product.image ? (
              <div className="overflow-hidden rounded-md border border-border bg-muted">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-64 w-full object-contain"
                />
              </div>
            ) : null}
            <Input
              id="product-image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={uploadingImage}
              onChange={(event) => {
                void handleImageUpload(event.target.files?.[0]);
              }}
            />
            <p className="text-xs text-muted-foreground">Hỗ trợ JPG, PNG, WEBP, GIF. Tối đa 5MB.</p>
            {uploadingImage ? (
              <p className="text-sm text-muted-foreground">Đang tải ảnh...</p>
            ) : null}
            {imageError ? <p className="text-sm text-destructive">{imageError}</p> : null}
            <div>
              <Label htmlFor="image-url">URL ảnh</Label>
              <Input
                id="image-url"
                value={product.image}
                onChange={(event) => {
                  setProduct({ ...product, image: event.target.value });
                }}
              />
            </div>
          </div>
          <div className="space-y-4 rounded-lg border border-border p-4">
            <div>
              <h2 className="text-lg font-semibold">Ảnh mô tả chi tiết</h2>
              <p className="text-sm text-muted-foreground">
                Hiển thị thành dải ảnh mô tả bên dưới trang sản phẩm.
              </p>
            </div>
            <div>
              <Label htmlFor="detail-image-upload">Tải ảnh mô tả</Label>
              <Input
                id="detail-image-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={uploadingDetailImage}
                onChange={(event) => {
                  void handleDetailImageUpload(event.target.files?.[0]);
                }}
              />
              {uploadingDetailImage ? (
                <p className="mt-2 text-sm text-muted-foreground">Đang tải ảnh...</p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setProduct({ ...product, detailImageUrls: [...product.detailImageUrls, ""] });
              }}
            >
              Thêm URL ảnh
            </Button>
            {product.detailImageUrls.length === 0 ? (
              <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                Chưa có ảnh mô tả nào.
              </p>
            ) : null}
            {product.detailImageUrls.map((imageUrl, index) => (
              <div key={index} className="grid gap-3 md:grid-cols-[120px_minmax(0,1fr)_auto]">
                <div className="overflow-hidden rounded-md border border-border bg-muted">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={`Ảnh mô tả ${index + 1}`}
                      className="h-28 w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-28 items-center justify-center text-xs text-muted-foreground">
                      Chưa có ảnh
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor={`detail-image-url-${index}`}>URL ảnh mô tả</Label>
                  <Input
                    id={`detail-image-url-${index}`}
                    value={imageUrl}
                    onChange={(event) => {
                      setProduct({
                        ...product,
                        detailImageUrls: product.detailImageUrls.map((item, itemIndex) =>
                          itemIndex === index ? event.target.value : item,
                        ),
                      });
                    }}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      setProduct({
                        ...product,
                        detailImageUrls: product.detailImageUrls.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      });
                    }}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Màu và ảnh theo màu</h2>
                <p className="text-sm text-muted-foreground">
                  Các màu này sẽ hiển thị ở trang chi tiết sản phẩm.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setProduct({
                    ...product,
                    colorVariants: [
                      ...product.colorVariants,
                      { ...emptyVariant(), sortOrder: product.colorVariants.length },
                    ],
                  });
                }}
              >
                Thêm màu
              </Button>
            </div>
            {product.colorVariants.length === 0 ? (
              <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                Chưa có màu nào. Sản phẩm sẽ dùng ảnh chính.
              </p>
            ) : null}
            {product.colorVariants.map((variant, index) => (
              <div key={variant.id ?? index} className="rounded-lg border border-border p-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor={`variant-name-${index}`}>Tên màu</Label>
                    <Input
                      id={`variant-name-${index}`}
                      value={variant.name}
                      onChange={(event) => {
                        updateVariant(index, { name: event.target.value });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`variant-color-${index}`}>Mã màu</Label>
                    <div className="flex gap-2">
                      <Input
                        id={`variant-color-${index}`}
                        value={variant.colorCode}
                        onChange={(event) => {
                          updateVariant(index, { colorCode: event.target.value });
                        }}
                      />
                      <Input
                        aria-label={`Chọn màu ${index + 1}`}
                        className="w-16 p-1"
                        type="color"
                        value={variant.colorCode || "#ffffff"}
                        onChange={(event) => {
                          updateVariant(index, { colorCode: event.target.value });
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`variant-sku-${index}`}>SKU/Reference</Label>
                    <Input
                      id={`variant-sku-${index}`}
                      value={variant.sku ?? ""}
                      onChange={(event) => {
                        updateVariant(index, { sku: event.target.value });
                      }}
                    />
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-[160px_1fr]">
                  <div className="overflow-hidden rounded-md border border-border bg-muted">
                    {variant.imageUrl ? (
                      <img
                        src={variant.imageUrl}
                        alt={variant.name || "Ảnh màu"}
                        className="h-36 w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-36 items-center justify-center text-sm text-muted-foreground">
                        Chưa có ảnh
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={`variant-upload-${index}`}>Tải ảnh màu</Label>
                      <Input
                        id={`variant-upload-${index}`}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        disabled={uploadingVariantIndex === index}
                        onChange={(event) => {
                          void handleVariantImageUpload(index, event.target.files?.[0]);
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`variant-url-${index}`}>URL ảnh màu</Label>
                      <Input
                        id={`variant-url-${index}`}
                        value={variant.imageUrl}
                        onChange={(event) => {
                          updateVariant(index, { imageUrl: event.target.value });
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        setProduct({
                          ...product,
                          colorVariants: product.colorVariants.filter(
                            (_, variantIndex) => variantIndex !== index,
                          ),
                        });
                      }}
                    >
                      Xóa màu
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="promotion"
              checked={product.isPromotionEligible}
              onCheckedChange={(checked) => {
                setProduct({ ...product, isPromotionEligible: checked });
              }}
            />
            <Label htmlFor="promotion">Áp dụng ưu đãi</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="active"
              checked={product.isActive}
              onCheckedChange={(checked) => {
                setProduct({
                  ...product,
                  isActive: checked,
                  visibility: checked ? "visible" : "hidden",
                });
              }}
            />
            <Label htmlFor="active">Hiển thị sản phẩm</Label>
          </div>
          <Button type="submit" disabled={saving} className="w-full gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="w-full gap-2"
            onClick={() => {
              if (window.confirm("Ẩn sản phẩm này? Không xóa cứng sản phẩm đã có đơn.")) {
                setProduct({ ...product, isActive: false, visibility: "hidden" });
                router.refresh();
              }
            }}
          >
            <EyeOff className="h-4 w-4" />
            Ẩn sản phẩm
          </Button>
        </Card>
      </form>
    </div>
  );
}

function parseAttributeLines(value: string): ProductAttribute[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex <= 0) {
        return [];
      }
      const label = line.slice(0, separatorIndex).trim();
      const attributeValue = line.slice(separatorIndex + 1).trim();
      return label && attributeValue ? [{ label, value: attributeValue }] : [];
    });
}

function formatAttributeLines(attributes: ProductAttribute[]): string {
  return attributes.map((attribute) => `${attribute.label}: ${attribute.value}`).join("\n");
}

function parseUrlLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
