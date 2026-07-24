"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import { getErrorMessage, getErrorMessages, productService } from "@/lib/services/api-service";
import type { ProductAttribute, ProductColorVariant } from "@/lib/types";
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

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    slug: "",
    shortDescription: "",
    description: "",
    listedPrice: "",
    discountAmount: "",
    category: "",
    image: "",
    productAttributes: [] as ProductAttribute[],
    detailImageUrls: [] as string[],
    sellerName: "",
    sellerYears: "",
    sellerPrimaryCategory: "",
    minimumOrderQuantity: "1",
    shippingOrigin: "",
    shippingLeadTime: "",
    returnPolicy: "",
    reviewRating: "",
    reviewCount: "",
    reviewTagsText: "",
    reviewImageUrlsText: "",
    qualityCertificationsText: "",
    packagingAttributesText: "",
    stock: "",
    isPromotionEligible: true,
    isActive: true,
    colorVariants: [] as ProductColorVariant[],
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [slugTouched, setSlugTouched] = useState(false);
  const [uploadingVariantIndex, setUploadingVariantIndex] = useState<number | null>(null);
  const [uploadingDetailImage, setUploadingDetailImage] = useState(false);

  async function handleImageUpload(file: File | undefined) {
    if (!file) {
      return;
    }
    setUploadingImage(true);
    setImageError("");
    try {
      const uploaded = await productService.uploadProductImage(file);
      setFormData((current) => ({ ...current, image: uploaded.imageUrl }));
    } catch (error) {
      console.error(error);
      setImageError("Không thể tải ảnh lên Cloudinary. Vui lòng thử lại.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleVariantImageUpload(index: number, file: File | undefined) {
    if (!file) {
      return;
    }
    setUploadingVariantIndex(index);
    setImageError("");
    try {
      const uploaded = await productService.uploadProductImage(file);
      setFormData((current) => ({
        ...current,
        colorVariants: current.colorVariants.map((variant, variantIndex) =>
          variantIndex === index ? { ...variant, imageUrl: uploaded.imageUrl } : variant,
        ),
      }));
    } catch (error) {
      setImageError(getErrorMessage(error));
    } finally {
      setUploadingVariantIndex(null);
    }
  }

  async function handleDetailImageUpload(file: File | undefined) {
    if (!file) {
      return;
    }
    setUploadingDetailImage(true);
    setImageError("");
    try {
      const uploaded = await productService.uploadProductImage(file);
      setFormData((current) => ({
        ...current,
        detailImageUrls: [...current.detailImageUrls, uploaded.imageUrl],
      }));
    } catch (error) {
      setImageError(getErrorMessage(error));
    } finally {
      setUploadingDetailImage(false);
    }
  }

  function updateAttribute(index: number, updates: Partial<ProductAttribute>) {
    setFormData((current) => ({
      ...current,
      productAttributes: current.productAttributes.map((attribute, attributeIndex) =>
        attributeIndex === index ? { ...attribute, ...updates } : attribute,
      ),
    }));
  }

  function updateVariant(index: number, updates: Partial<ProductColorVariant>) {
    setFormData((current) => ({
      ...current,
      colorVariants: current.colorVariants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, ...updates, sortOrder: index } : variant,
      ),
    }));
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setFormErrors([]);

    try {
      const slug = formData.slug.trim() || slugifyVietnamese(formData.name);
      await productService.createProduct({
        category: formData.category.trim(),
        description: formData.description.trim(),
        discountAmount: Number(formData.discountAmount || 0),
        image: formData.image,
        productAttributes: formData.productAttributes,
        detailImageUrls: formData.detailImageUrls,
        sellerName: formData.sellerName.trim(),
        sellerYears: formData.sellerYears ? Number(formData.sellerYears) : undefined,
        sellerPrimaryCategory: formData.sellerPrimaryCategory.trim(),
        minimumOrderQuantity: Number(formData.minimumOrderQuantity || 1),
        shippingOrigin: formData.shippingOrigin.trim(),
        shippingLeadTime: formData.shippingLeadTime.trim(),
        returnPolicy: formData.returnPolicy.trim(),
        reviewRating: formData.reviewRating ? Number(formData.reviewRating) : undefined,
        reviewCount: formData.reviewCount ? Number(formData.reviewCount) : undefined,
        reviewTags: parseAttributeLines(formData.reviewTagsText),
        reviewImageUrls: parseUrlLines(formData.reviewImageUrlsText),
        qualityCertifications: parseAttributeLines(formData.qualityCertificationsText),
        packagingAttributes: parseAttributeLines(formData.packagingAttributesText),
        isActive: formData.isActive,
        isPromotionEligible: formData.isPromotionEligible,
        listedPrice: Number(formData.listedPrice || 0),
        name: formData.name.trim(),
        shortDescription: formData.shortDescription.trim(),
        sku: formData.sku.trim(),
        slug,
        sortOrder: 0,
        stock: formData.stock ? Number(formData.stock) : undefined,
        visibility: formData.isActive ? "visible" : "hidden",
        colorVariants: formData.colorVariants.map((variant, index) => ({
          ...variant,
          sortOrder: index,
        })),
      });
      router.push("/admin/products");
    } catch (error) {
      setFormErrors(getErrorMessages(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Tổng quan", href: "/admin" },
          { label: "Sản phẩm", href: "/admin/products" },
          { label: "Thêm mới" },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Thêm sản phẩm mới</h1>
          <p className="mt-1 text-muted-foreground">Tạo một sản phẩm mới cho cửa hàng</p>
        </div>
      </div>

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

      {/* Form */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <form
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
            className="space-y-6"
          >
            {/* Basic Info */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Thông tin cơ bản</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Tên sản phẩm</Label>
                  <Input
                    id="name"
                    placeholder="VD: Laptop Dell XPS 13"
                    value={formData.name}
                    onChange={(e) => {
                      const nextName = e.target.value;
                      setFormData({
                        ...formData,
                        name: nextName,
                        slug: slugTouched ? formData.slug : slugifyVietnamese(nextName),
                      });
                    }}
                    required
                  />
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      placeholder="VD: LAP-001"
                      value={formData.sku}
                      onChange={(e) => {
                        setFormData({ ...formData, sku: e.target.value });
                      }}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      placeholder="vd: dior-jadore-intense"
                      value={formData.slug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        setFormData({ ...formData, slug: slugifyVietnamese(e.target.value) });
                      }}
                      required
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Chỉ dùng chữ thường, số và dấu gạch ngang.
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Danh mục</Label>
                  <Input
                    id="category"
                    placeholder="VD: Nước hoa"
                    value={formData.category}
                    onChange={(e) => {
                      setFormData({ ...formData, category: e.target.value });
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="shortDescription">Mô tả ngắn</Label>
                  <Input
                    id="shortDescription"
                    placeholder="Tóm tắt sản phẩm"
                    value={formData.shortDescription}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        shortDescription: e.target.value,
                      });
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Mô tả chi tiết</Label>
                  <Textarea
                    id="description"
                    placeholder="Mô tả đầy đủ về sản phẩm"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                    }}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold">Dữ liệu chi tiết kiểu 1688</h2>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="sellerName">Tên nhà bán</Label>
                    <Input
                      id="sellerName"
                      placeholder="Công ty TNHH..."
                      value={formData.sellerName}
                      onChange={(event) => {
                        setFormData({ ...formData, sellerName: event.target.value });
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
                      placeholder="3"
                      value={formData.sellerYears}
                      onChange={(event) => {
                        setFormData({ ...formData, sellerYears: event.target.value });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sellerPrimaryCategory">Ngành hàng chính</Label>
                    <Input
                      id="sellerPrimaryCategory"
                      placeholder="Sản phẩm chăm sóc tóc"
                      value={formData.sellerPrimaryCategory}
                      onChange={(event) => {
                        setFormData({ ...formData, sellerPrimaryCategory: event.target.value });
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
                      value={formData.minimumOrderQuantity}
                      onChange={(event) => {
                        setFormData({ ...formData, minimumOrderQuantity: event.target.value });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingOrigin">Nơi gửi hàng</Label>
                    <Input
                      id="shippingOrigin"
                      placeholder="Sán Đầu, Quảng Đông"
                      value={formData.shippingOrigin}
                      onChange={(event) => {
                        setFormData({ ...formData, shippingOrigin: event.target.value });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingLeadTime">Cam kết giao hàng</Label>
                    <Input
                      id="shippingLeadTime"
                      placeholder="Giao hàng trong vòng 48 giờ"
                      value={formData.shippingLeadTime}
                      onChange={(event) => {
                        setFormData({ ...formData, shippingLeadTime: event.target.value });
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="returnPolicy">Chính sách nổi bật</Label>
                  <Input
                    id="returnPolicy"
                    placeholder="Miễn phí vận chuyển trả hàng"
                    value={formData.returnPolicy}
                    onChange={(event) => {
                      setFormData({ ...formData, returnPolicy: event.target.value });
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
                      placeholder="4.4"
                      value={formData.reviewRating}
                      onChange={(event) => {
                        setFormData({ ...formData, reviewRating: event.target.value });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reviewCount">Số đánh giá</Label>
                    <Input
                      id="reviewCount"
                      type="number"
                      min={0}
                      placeholder="70"
                      value={formData.reviewCount}
                      onChange={(event) => {
                        setFormData({ ...formData, reviewCount: event.target.value });
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="reviewTagsText">Thẻ đánh giá</Label>
                  <Textarea
                    id="reviewTagsText"
                    rows={3}
                    placeholder={"Dịch vụ chăm sóc khách hàng: 10+\nGiá rất rẻ: 10+"}
                    value={formData.reviewTagsText}
                    onChange={(event) => {
                      setFormData({ ...formData, reviewTagsText: event.target.value });
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="reviewImageUrlsText">Ảnh đánh giá</Label>
                  <Textarea
                    id="reviewImageUrlsText"
                    rows={3}
                    placeholder={
                      "https://cdn.example.com/review-1.jpg\nhttps://cdn.example.com/review-2.jpg"
                    }
                    value={formData.reviewImageUrlsText}
                    onChange={(event) => {
                      setFormData({ ...formData, reviewImageUrlsText: event.target.value });
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
                    placeholder={
                      "Cảnh báo: Mỹ phẩm không thay thế thuốc\nSố đăng ký: Quảng Đông G, 2025056915"
                    }
                    value={formData.qualityCertificationsText}
                    onChange={(event) => {
                      setFormData({ ...formData, qualityCertificationsText: event.target.value });
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="packagingAttributesText">Đóng gói</Label>
                  <Textarea
                    id="packagingAttributesText"
                    rows={3}
                    placeholder={"Trọng lượng: 70g\nKích thước: 10 x 4 x 4 cm"}
                    value={formData.packagingAttributesText}
                    onChange={(event) => {
                      setFormData({ ...formData, packagingAttributesText: event.target.value });
                    }}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Thông số sản phẩm</h2>
                  <p className="text-sm text-muted-foreground">
                    Hiển thị như bảng thuộc tính trên trang chi tiết sản phẩm.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      productAttributes: [...formData.productAttributes, emptyAttribute()],
                    });
                  }}
                >
                  Thêm thông số
                </Button>
              </div>
              <div className="space-y-3">
                {formData.productAttributes.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Chưa có thông số nào.
                  </p>
                ) : null}
                {formData.productAttributes.map((attribute, index) => (
                  <div
                    key={index}
                    className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]"
                  >
                    <div>
                      <Label htmlFor={`attribute-label-${index}`}>Tên thông số</Label>
                      <Input
                        id={`attribute-label-${index}`}
                        placeholder="VD: Chất liệu"
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
                        placeholder="VD: Cotton"
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
                          setFormData({
                            ...formData,
                            productAttributes: formData.productAttributes.filter(
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
            </Card>

            {/* Pricing */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Giá bán</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="listedPrice">Giá gốc (VND)</Label>
                  <Input
                    id="listedPrice"
                    type="number"
                    placeholder="0"
                    value={formData.listedPrice}
                    onChange={(e) => {
                      setFormData({ ...formData, listedPrice: e.target.value });
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="discountAmount">Giảm giá ưu đãi (VND)</Label>
                  <Input
                    id="discountAmount"
                    type="number"
                    placeholder="0"
                    value={formData.discountAmount}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        discountAmount: e.target.value,
                      });
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Nhập 25000 để giảm 25,000 ₫ cho khách hàng ưu đãi
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Màu và ảnh theo màu</h2>
                  <p className="text-sm text-muted-foreground">
                    Mỗi màu có ảnh riêng để hiển thị ở trang chi tiết.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      colorVariants: [
                        ...formData.colorVariants,
                        { ...emptyVariant(), sortOrder: formData.colorVariants.length },
                      ],
                    });
                  }}
                >
                  Thêm màu
                </Button>
              </div>
              <div className="space-y-5">
                {formData.colorVariants.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Chưa có màu nào. Sản phẩm sẽ dùng ảnh chính.
                  </p>
                ) : null}
                {formData.colorVariants.map((variant, index) => (
                  <div key={index} className="rounded-lg border border-border p-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <Label htmlFor={`variant-name-${index}`}>Tên màu</Label>
                        <Input
                          id={`variant-name-${index}`}
                          placeholder="VD: Rose Tendre"
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
                            setFormData({
                              ...formData,
                              colorVariants: formData.colorVariants.filter(
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

            {/* Stock */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Ảnh sản phẩm</h2>
              <div className="space-y-4">
                {formData.image ? (
                  <div className="overflow-hidden rounded-md border border-border bg-muted">
                    <img
                      src={formData.image}
                      alt="Ảnh sản phẩm đã tải lên"
                      className="h-56 w-full object-contain"
                    />
                  </div>
                ) : null}
                <div>
                  <Label htmlFor="product-image">Tải ảnh lên Cloudinary</Label>
                  <Input
                    id="product-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    disabled={uploadingImage}
                    onChange={(event) => {
                      void handleImageUpload(event.target.files?.[0]);
                    }}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Hỗ trợ JPG, PNG, WEBP, GIF. Tối đa 5MB.
                  </p>
                  {uploadingImage ? (
                    <p className="mt-2 text-sm text-muted-foreground">Đang tải ảnh...</p>
                  ) : null}
                  {imageError ? (
                    <p className="mt-2 text-sm text-destructive">{imageError}</p>
                  ) : null}
                </div>
                <div>
                  <Label htmlFor="image-url">URL ảnh</Label>
                  <Input
                    id="image-url"
                    placeholder="https://res.cloudinary.com/..."
                    value={formData.image}
                    onChange={(event) => {
                      setFormData({ ...formData, image: event.target.value });
                    }}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold">Ảnh mô tả chi tiết</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="detail-image-upload">Tải ảnh mô tả lên Cloudinary</Label>
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
                    setFormData({
                      ...formData,
                      detailImageUrls: [...formData.detailImageUrls, ""],
                    });
                  }}
                >
                  Thêm URL ảnh
                </Button>
                {formData.detailImageUrls.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Chưa có ảnh mô tả nào.
                  </p>
                ) : null}
                <div className="space-y-3">
                  {formData.detailImageUrls.map((imageUrl, index) => (
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
                            setFormData({
                              ...formData,
                              detailImageUrls: formData.detailImageUrls.map((item, itemIndex) =>
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
                            setFormData({
                              ...formData,
                              detailImageUrls: formData.detailImageUrls.filter(
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
              </div>
            </Card>

            {/* Stock */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Tồn kho</h2>
              <div>
                <Label htmlFor="stock">Số lượng tồn kho</Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="0"
                  value={formData.stock}
                  onChange={(e) => {
                    setFormData({ ...formData, stock: e.target.value });
                  }}
                />
              </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button type="submit" disabled={loading} size="lg">
                {loading ? "Đang lưu..." : "Lưu sản phẩm"}
              </Button>
              <Link href="/admin/products">
                <Button variant="outline" size="lg">
                  Hủy
                </Button>
              </Link>
            </div>
          </form>
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Cấu hình</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isPromotionEligible"
                  checked={formData.isPromotionEligible}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      isPromotionEligible: checked,
                    });
                  }}
                />
                <Label htmlFor="isPromotionEligible" className="cursor-pointer">
                  Áp dụng ưu đãi
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => {
                    setFormData({ ...formData, isActive: checked });
                  }}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Kích hoạt sản phẩm
                </Label>
              </div>
            </div>
          </Card>
        </div>
      </div>
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

function parseUrlLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
