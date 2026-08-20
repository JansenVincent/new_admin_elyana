import MyProductDetailView from "@/presentation/components/product/MyProductDetail";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Halaman detail product My Product berdasarkan slug_id URL.
 */
export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;

  return <MyProductDetailView slugId={slug} />;
}
