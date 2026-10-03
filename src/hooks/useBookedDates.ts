import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BookedDate {
  date: string;
  time_slot: string;
  booking_id: string;
}

export const useBookedDates = (productId: string) => {
  const [bookedDates, setBookedDates] = useState<BookedDate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;

    const fetchBookedDates = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('product_availability')
          .select('availability_date, time_slot, booking_id')
          .eq('product_id', productId)
          .eq('is_booked', true);

        if (error) throw error;

        const formattedDates = data?.map(item => ({
          date: item.availability_date,
          time_slot: item.time_slot,
          booking_id: item.booking_id
        })) || [];

        setBookedDates(formattedDates);
      } catch (error) {
        console.error('Error fetching booked dates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookedDates();

    // Set up real-time subscription
    const channel = supabase
      .channel('product-availability-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_availability',
          filter: `product_id=eq.${productId}`
        },
        () => {
          fetchBookedDates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId]);

  const isDateBooked = (date: Date, timeSlot: string) => {
    const dateString = date.toISOString().split('T')[0];
    return bookedDates.some(
      booked => booked.date === dateString && booked.time_slot === timeSlot
    );
  };

  const isDateFullyBooked = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const bookedSlotsForDate = bookedDates.filter(
      booked => booked.date === dateString
    );
    // Consider the date unavailable if any slot is booked
    return bookedSlotsForDate.length >= 1;
  };

  return { bookedDates, loading, isDateBooked, isDateFullyBooked };
};