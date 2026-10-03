import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Navbar } from '@/components/Navbar';
import { AdminProducts } from '@/components/AdminProducts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Pencil } from 'lucide-react';

interface BookingRow {
  id: string;
  user_id: string;
  product_id: string;
  booking_date: string;
  time_slot: string;
  status: string;
  advance_amount: number | null;
  created_at: string;
  customer: { name: string; mobile: string | null; college: string | null; address: string | null };
  product: { name: string; price: number; image_url: string };
}

const rupees = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : `₹${Number(n).toLocaleString('en-IN')}`;

const thumb = (url?: string) => (url && url.startsWith('http') ? url : '/placeholder.svg');

const ProductCell = ({ b }: { b: BookingRow }) => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
      <img
        src={thumb(b.product.image_url)}
        alt={b.product.name}
        className="w-full h-full object-cover"
        onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
      />
    </div>
    <div>
      <p className="font-medium text-sm">{b.product.name}</p>
      <p className="text-xs text-muted-foreground">{rupees(b.product.price)}</p>
    </div>
  </div>
);

const UpdatedAdminDashboard = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Approve / edit-advance dialog
  const [dialogBooking, setDialogBooking] = useState<BookingRow | null>(null);
  const [advance, setAdvance] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data: rows, error } = await supabase
        .from('bookings')
        .select('*, products(name, price, image_url)')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const userIds = [...new Set((rows || []).map((r: any) => r.user_id))];
      const { data: profiles, error: profErr } = userIds.length
        ? await supabase.from('profiles').select('user_id, name, mobile, college, address').in('user_id', userIds)
        : { data: [], error: null };
      if (profErr) throw profErr;

      const byUser = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      setBookings(
        (rows || []).map((r: any) => ({
          ...r,
          customer: byUser.get(r.user_id) || { name: 'Unknown', mobile: null, college: null, address: null },
          product: r.products || { name: 'Unknown Product', price: 0, image_url: '' }
        }))
      );
    } catch (err) {
      console.error('Error fetching bookings:', err);
      toast({ title: 'Error', description: 'Failed to load bookings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('admin-bookings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, () => {
        toast({ title: 'New booking request!', description: 'A customer has requested a booking.' });
        fetchData();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData, toast]);

  const pending = bookings.filter(b => b.status === 'pending');
  const accepted = bookings.filter(b => b.status === 'accepted');

  const openDialog = (b: BookingRow) => {
    setDialogBooking(b);
    setAdvance(b.advance_amount !== null ? String(b.advance_amount) : '');
  };

  const saveAdvance = async () => {
    if (!dialogBooking) return;
    const amount = parseFloat(advance);
    if (isNaN(amount) || amount < 0) {
      toast({ title: 'Enter a valid amount', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'accepted', advance_amount: amount })
        .eq('id', dialogBooking.id);
      if (error) throw error;
      toast({
        title: dialogBooking.status === 'accepted' ? 'Advance updated' : 'Booking approved',
        description: `Advance payment recorded: ${rupees(amount)}`
      });
      setDialogBooking(null);
      fetchData();
    } catch (err) {
      console.error('Error saving advance:', err);
      toast({ title: 'Error', description: 'Could not save. Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const decline = async (id: string) => {
    try {
      const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Request declined' });
      fetchData();
    } catch (err) {
      console.error('Error declining booking:', err);
      toast({ title: 'Error', description: 'Failed to decline request', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <Tabs defaultValue="requests" className="space-y-6">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="requests">
                Requests{pending.length > 0 && ` (${pending.length})`}
              </TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </TabsList>

            {/* ---------- Requests ---------- */}
            <TabsContent value="requests">
              <Card>
                <CardHeader>
                  <CardTitle>Booking Requests</CardTitle>
                  <CardDescription>
                    Approve a request and enter the advance payment the customer has deposited.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {pending.length === 0 ? (
                    <p className="text-muted-foreground py-6 text-center">No pending requests.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Mobile</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pending.map(b => (
                          <TableRow key={b.id}>
                            <TableCell><ProductCell b={b} /></TableCell>
                            <TableCell>
                              <p className="font-medium">{b.customer.name}</p>
                              <p className="text-xs text-muted-foreground">{b.customer.college || ''}</p>
                            </TableCell>
                            <TableCell>{b.customer.mobile || '—'}</TableCell>
                            <TableCell>{new Date(b.booking_date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex gap-2 justify-end">
                                <Button size="sm" onClick={() => openDialog(b)}>Approve</Button>
                                <Button size="sm" variant="outline" onClick={() => decline(b.id)}>Decline</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ---------- Customers + advance ---------- */}
            <TabsContent value="customers">
              <Card>
                <CardHeader>
                  <CardTitle>Customers &amp; Advance Payments</CardTitle>
                  <CardDescription>Approved bookings with the advance amount deposited.</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {accepted.length === 0 ? (
                    <p className="text-muted-foreground py-6 text-center">No approved bookings yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Mobile</TableHead>
                          <TableHead>College</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Advance Paid</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accepted.map(b => (
                          <TableRow key={b.id}>
                            <TableCell className="font-medium">{b.customer.name}</TableCell>
                            <TableCell>{b.customer.mobile || '—'}</TableCell>
                            <TableCell>{b.customer.college || '—'}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={b.customer.address || ''}>
                              {b.customer.address || '—'}
                            </TableCell>
                            <TableCell><ProductCell b={b} /></TableCell>
                            <TableCell>{new Date(b.booking_date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">{rupees(b.product.price)}</TableCell>
                            <TableCell className="text-right">
                              {b.advance_amount === null
                                ? <Badge variant="secondary">Not entered</Badge>
                                : <span className="font-semibold text-success">{rupees(b.advance_amount)}</span>}
                            </TableCell>
                            <TableCell className="text-right">
                              {b.advance_amount === null ? '—' : rupees(Math.max(b.product.price - b.advance_amount, 0))}
                            </TableCell>
                            <TableCell>
                              <Button size="icon" variant="ghost" onClick={() => openDialog(b)} title="Edit advance">
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ---------- Products & photos ---------- */}
            <TabsContent value="products">
              <AdminProducts />
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Approve / edit advance dialog */}
      <Dialog open={!!dialogBooking} onOpenChange={(o) => !o && setDialogBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogBooking?.status === 'accepted' ? 'Edit advance payment' : 'Approve booking'}
            </DialogTitle>
            <DialogDescription>
              {dialogBooking?.customer.name} — {dialogBooking?.product.name}
              {dialogBooking && ` (${rupees(dialogBooking.product.price)})`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="advance">Advance payment deposited (₹)</Label>
            <Input
              id="advance"
              type="number"
              min="0"
              inputMode="decimal"
              autoFocus
              value={advance}
              onChange={(e) => setAdvance(e.target.value)}
              placeholder="e.g. 2000"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogBooking(null)}>Cancel</Button>
            <Button onClick={saveAdvance} disabled={saving || advance === ''}>
              {saving ? 'Saving...' : dialogBooking?.status === 'accepted' ? 'Save' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UpdatedAdminDashboard;
