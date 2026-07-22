import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import ProductForm from "@/components/ProductForm";
import { updateProductAction } from "../../../actions";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const user = await requireUser(["SUPPLIER"]);

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || product.supplierId !== user.id) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-6">Edit product</h1>
      <p className="text-xs text-foreground/50 mb-4">
        Saving changes will send this listing back for admin review.
      </p>
      <div className="card p-6">
        <ProductForm
          action={updateProductAction}
          submitLabel="Save changes"
          defaultValues={{
            productId: product.id,
            title: product.title,
            description: product.description,
            category: product.category,
            price: product.price,
            unit: product.unit,
            stock: product.stock,
            imageUrl: product.imageUrl,
            isDigital: product.isDigital,
            fileUrl: product.fileUrl,
          }}
        />
      </div>
    </div>
  );
}
