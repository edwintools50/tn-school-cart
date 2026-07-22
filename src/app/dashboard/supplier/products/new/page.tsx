import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import ProductForm from "@/components/ProductForm";
import { createProductAction } from "../../actions";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ duplicate?: string }>;
}) {
  const user = await requireUser(["SUPPLIER"]);
  const { duplicate } = await searchParams;

  const source = duplicate
    ? await db.product.findUnique({ where: { id: duplicate } })
    : null;
  const sourceProduct = source && source.supplierId === user.id ? source : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-1">
        {sourceProduct ? "Duplicate product" : "List a new product"}
      </h1>
      {sourceProduct && (
        <p className="text-sm text-foreground/60 mb-6">
          Fields are pre-filled from &ldquo;{sourceProduct.title}&rdquo;. Edit
          what&apos;s different and submit.
        </p>
      )}
      <div className={sourceProduct ? "card p-6" : "card p-6 mt-6"}>
        <ProductForm
          action={createProductAction}
          submitLabel="Submit for review"
          defaultValues={
            sourceProduct
              ? {
                  title: sourceProduct.title,
                  description: sourceProduct.description,
                  category: sourceProduct.category,
                  price: sourceProduct.price,
                  unit: sourceProduct.unit,
                  stock: sourceProduct.stock,
                  imageUrl: sourceProduct.imageUrl,
                  isDigital: sourceProduct.isDigital,
                  fileUrl: sourceProduct.fileUrl,
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
