import React, { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil } from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import {
  loadProducts,
  money,
  toCents,
  result,
  uploadProductImage,
} from "@/lib/wallet-api";
import {
  PageHeader,
  ErrorMessage,
  Loading,
  Empty,
  Status,
  Field,
} from "@/components/admin/AdminUI";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const blank = {
  sku: "",
  name: "",
  category: "Coin",
  description: "",
  weight_label: "",
  oz_amount: "",
  purity: "916.7",
  price: "",
  image_url: "",
  active: false,
};
function ProductEditor({ product, onClose, onSaved }) {
  const [form, setForm] = useState(
    product
      ? { ...product, price: (product.price_cents / 100).toFixed(2) }
      : blank,
  );
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const save = async (event) => {
    event.preventDefault();
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError(null);
    let uploaded;
    try {
      const price_cents = toCents(form.price);
      if (price_cents > 10000000000)
        throw new Error("Product price exceeds the supported limit.");
      if (
        !Number.isFinite(Number(form.oz_amount)) ||
        Number(form.oz_amount) <= 0
      )
        throw new Error("Enter a positive gold weight.");
      if (file) uploaded = await uploadProductImage(file);
      const payload = {
        sku: form.sku.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        weight_label: form.weight_label.trim(),
        oz_amount: Number(form.oz_amount),
        purity: form.purity.trim(),
        price_cents,
        image_url: uploaded?.url ?? form.image_url,
        active: form.active,
      };
      await result(
        product
          ? supabase
              .from("products")
              .update(payload)
              .eq("id", product.id)
              .select("id")
              .single()
          : supabase.from("products").insert(payload).select("id").single(),
      );
      onSaved();
      onClose();
    } catch (err) {
      if (uploaded)
        await supabase.storage.from("product-images").remove([uploaded.path]);
      setError(err);
    } finally {
      setBusy(false);
      saving.current = false;
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(value) => {
        if (!value && !busy) onClose();
      }}
    >
      <DialogContent
        className="admin-shell admin-modal"
        style={{ display: "block" }}
        onEscapeKeyDown={(e) => busy && e.preventDefault()}
        onInteractOutside={(e) => busy && e.preventDefault()}
      >
        <DialogTitle className="sr-only">
          {product ? "Edit product" : "Add product"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Set product details, upload an image and choose whether to publish it.
        </DialogDescription>
        <div className="admin-modal-heading">
          <h2>{product ? "Edit product" : "Add a product"}</h2>
        </div>
        <ErrorMessage error={error} />
        <form onSubmit={save} className="admin-form-grid">
          <Field label="Product name">
            <input
              required
              maxLength={160}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          <Field label="SKU">
            <input
              required
              maxLength={64}
              value={form.sku}
              onChange={(e) => set("sku", e.target.value)}
            />
          </Field>
          <Field label="Price (ZAR)">
            <input
              required
              type="number"
              min="0.01"
              max="100000000"
              step="0.01"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
            />
          </Field>
          <Field label="Category">
            <input
              required
              maxLength={80}
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            />
          </Field>
          <Field label="Display weight">
            <input
              required
              maxLength={80}
              placeholder="1/4 oz"
              value={form.weight_label}
              onChange={(e) => set("weight_label", e.target.value)}
            />
          </Field>
          <Field label="Troy ounces">
            <input
              required
              type="number"
              min="0.000001"
              max="999999"
              step="0.000001"
              value={form.oz_amount}
              onChange={(e) => set("oz_amount", e.target.value)}
            />
          </Field>
          <Field label="Fineness">
            <input
              required
              maxLength={40}
              value={form.purity}
              onChange={(e) => set("purity", e.target.value)}
            />
          </Field>
          <Field label="Product photo" hint="JPG, PNG or WebP · maximum 5 MB">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Field>
          {form.image_url && (
            <img
              className="admin-image-preview"
              src={form.image_url}
              alt="Current product"
            />
          )}
          <div className="admin-full">
            <Field label="Description">
              <textarea
                rows={3}
                maxLength={3000}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
          </div>
          <label className="admin-check admin-full">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
            />
            Publish this product in the customer catalog
          </label>
          <footer className="admin-full">
            <button
              type="button"
              disabled={busy}
              className="admin-button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button disabled={busy} className="admin-button primary">
              {busy ? "Saving…" : "Save product"}
            </button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminProducts() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["products", "admin"],
    queryFn: () => loadProducts(true),
  });
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(undefined);
  const [saved, setSaved] = useState(false);
  const products = (query.data ?? []).filter((p) =>
    `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        title="Products & prices"
        description="Manage your gold catalog. Published changes appear in the customer wallet."
      >
        <button
          className="admin-button primary"
          onClick={() => {
            setEditing(null);
            setSaved(false);
          }}
        >
          <Plus size={17} />
          Add product
        </button>
      </PageHeader>
      <ErrorMessage error={query.error} />
      {saved && (
        <p role="status" className="admin-success">
          Product saved. The customer catalog will refresh with your changes.
        </p>
      )}
      <div className="admin-toolbar">
        <input
          className="admin-search"
          aria-label="Search products"
          placeholder="Search name or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="admin-card-note">{products.length} products</span>
      </div>
      {query.isPending ? (
        <Loading />
      ) : products.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>WEIGHT</th>
                <th>PRICE · ZAR</th>
                <th>VISIBILITY</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="product-cell">
                      {p.image_url && <img src={p.image_url} alt="" />}
                      <div>
                        {p.name}
                        <small>{p.sku}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    {p.weight_label}
                    <small>{p.purity} fineness</small>
                  </td>
                  <td className="amount">{money(p.price_cents)}</td>
                  <td>
                    <Status value={p.active ? "active" : "draft"} />
                  </td>
                  <td>
                    <button
                      className="admin-button"
                      onClick={() => {
                        setEditing(p);
                        setSaved(false);
                      }}
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !query.error && (
          <Empty>
            {search
              ? "No products match your search."
              : "Add your first product to get started."}
          </Empty>
        )
      )}
      {editing !== undefined && (
        <ProductEditor
          product={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            client.invalidateQueries({ queryKey: ["products"] });
            client.invalidateQueries({ queryKey: ["admin-stats"] });
            setSaved(true);
          }}
        />
      )}
    </>
  );
}
