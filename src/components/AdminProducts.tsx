import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/hooks/useProducts';
import { ImagePlus, Pencil, Plus, Trash2, Upload } from 'lucide-react';

const BUCKET = 'product-images';
const MAX_MB = 5;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

// Old seed rows point at "/src/assets/..." which only works in dev, so treat as "no photo"
const hasRealImage = (url?: string) => !!url && url.startsWith('http');

const pathFromUrl = (url: string) => {
  const marker = `/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split('?')[0]);
};

interface FormState {
  name: string;
  category: 'GHAGRA' | 'JEWELLERY';
  color: string;
  price: string;
}
const emptyForm: FormState = { name: '', category: 'GHAGRA', color: '', price: '' };

export const AdminProducts = () => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: 'Could not load products', variant: 'destructive' });
    } else {
      setProducts((data as Product[]) || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // free the temporary preview URL
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFile(null);
    setPreview(null);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, category: p.category, color: p.color, price: String(p.price) });
    setFile(null);
    setPreview(hasRealImage(p.image_url) ? p.image_url : null);
    setOpen(true);
  };

  const onPickFile = (f: File | undefined) => {
    if (!f) return;
    if (!ALLOWED.includes(f.type)) {
      toast({ title: 'Unsupported file', description: 'Use a JPG, PNG or WebP image.', variant: 'destructive' });
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      toast({ title: 'Image too large', description: `Max size is ${MAX_MB} MB.`, variant: 'destructive' });
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const uploadImage = async (f: File) => {
    const ext = f.type === 'image/png' ? 'png' : f.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, f, {
      contentType: f.type,
      cacheControl: '31536000',
    });
    if (error) throw error;
    return { path, url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
  };

  const save = async () => {
    const price = parseFloat(form.price);
    if (!form.name.trim() || !form.color.trim() || isNaN(price) || price < 0) {
      toast({ title: 'Fill all fields', description: 'Name, colour and a valid price are required.', variant: 'destructive' });
      return;
    }
    if (!editing && !file) {
      toast({ title: 'Add a photo', description: 'Choose a picture for this product.', variant: 'destructive' });
      return;
    }

    let uploaded: { path: string; url: string } | null = null;
    try {
      setSaving(true);
      if (file) uploaded = await uploadImage(file);

      const payload = {
        name: form.name.trim(),
        category: form.category,
        color: form.color.trim(),
        price,
        ...(uploaded ? { image_url: uploaded.url } : {}),
      };

      if (editing) {
        const { error } = await supabase.from('products').update(payload).eq('id', editing.id);
        if (error) throw error;
        // clean up the replaced photo
        if (uploaded) {
          const old = pathFromUrl(editing.image_url);
          if (old) await supabase.storage.from(BUCKET).remove([old]);
        }
        toast({ title: 'Product updated' });
      } else {
        const { error } = await supabase
          .from('products')
          .insert({ ...payload, image_url: uploaded!.url, available: true });
        if (error) throw error;
        toast({ title: 'Product added' });
      }
      setOpen(false);
      fetchProducts();
    } catch (err) {
      // don't leave an orphan upload behind if the DB write failed
      if (uploaded) await supabase.storage.from(BUCKET).remove([uploaded.path]);
      console.error('Save product failed:', err);
      toast({
        title: 'Could not save',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailable = async (p: Product, available: boolean) => {
    setProducts(prev => prev.map(x => (x.id === p.id ? { ...x, available } : x)));
    const { error } = await supabase.from('products').update({ available }).eq('id', p.id);
    if (error) {
      toast({ title: 'Error', description: 'Could not update availability', variant: 'destructive' });
      fetchProducts();
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const p = toDelete;
    const { error } = await supabase.from('products').delete().eq('id', p.id);
    setToDelete(null);
    if (error) {
      toast({ title: 'Could not delete', description: error.message, variant: 'destructive' });
      return;
    }
    const old = pathFromUrl(p.image_url);
    if (old) await supabase.storage.from(BUCKET).remove([old]);
    toast({ title: 'Product deleted' });
    fetchProducts();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Products &amp; Photos</CardTitle>
          <CardDescription>Add new items, replace pictures, or hide items that are not available.</CardDescription>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" /> Add product
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No products yet. Click “Add product”.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map(p => (
              <div key={p.id} className="border border-border rounded-lg overflow-hidden bg-card">
                <div className="aspect-[4/5] bg-muted relative">
                  {hasRealImage(p.image_url) ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <button
                      onClick={() => openEdit(p)}
                      className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
                    >
                      <ImagePlus className="w-8 h-8" />
                      <span className="text-xs">No photo — click to add</span>
                    </button>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{p.category}</Badge>
                    <span className="text-xs text-muted-foreground">{p.color}</span>
                  </div>
                  <p className="font-medium text-sm line-clamp-2">{p.name}</p>
                  <p className="text-primary font-semibold">₹{Number(p.price).toLocaleString('en-IN')}</p>
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Switch checked={p.available} onCheckedChange={(v) => toggleAvailable(p, v)} />
                      {p.available ? 'Available' : 'Hidden'}
                    </label>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)} title="Edit">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setToDelete(p)} title="Delete">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add / edit dialog */}
      <Dialog open={open} onOpenChange={(o) => !saving && setOpen(o)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit product' : 'Add product'}</DialogTitle>
            <DialogDescription>JPG, PNG or WebP, up to {MAX_MB} MB. Portrait photos look best.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => { onPickFile(e.target.files?.[0]); e.target.value = ''; }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full aspect-[4/3] border-2 border-dashed border-border rounded-lg overflow-hidden flex items-center justify-center bg-muted/30 hover:border-primary transition-colors"
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Upload className="w-10 h-10 mx-auto mb-2" />
                    <p className="text-sm">Click to choose a photo</p>
                  </div>
                )}
              </button>
              {preview && (
                <Button type="button" variant="link" size="sm" className="px-0" onClick={() => fileRef.current?.click()}>
                  Change photo
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="p-name">Name</Label>
              <Input id="p-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Royal Golden Ghagra" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as FormState['category'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GHAGRA">Ghagra</SelectItem>
                    <SelectItem value="JEWELLERY">Jewellery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-color">Colour</Label>
                <Input id="p-color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="Golden" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="p-price">Rental price (₹)</Label>
              <Input id="p-price" type="number" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Add product'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{toDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This also removes its bookings and reviews. If you only want to stop it being booked, switch it to Hidden instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
