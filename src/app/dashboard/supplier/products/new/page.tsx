import { requireUser } from "@/lib/auth";
import ProductForm from "@/components/ProductForm";
import { createProductAction } from "../../actions";

export default async function NewProductPage() {
  await requireUser(["SUPPLIER"]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-6">List a new product</h1>
      <div className="card p-6">
        <ProductForm action={createProductAction} submitLabel="Submit for review" />
      </div>
    </div>
  );
}
