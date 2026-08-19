import MyProductDetailView from "@/presentation/components/product/MyProductDetail";

interface MyProductDetailPageProps {
  params: Promise<{ productId: string }>;
}

/**
 * Halaman detail product My Product berdasarkan product_id.
 */
export default async function MyProductDetailPage({
  params,
}: MyProductDetailPageProps) {
  const { productId } = await params;

  return <MyProductDetailView productId={productId} />;
}
