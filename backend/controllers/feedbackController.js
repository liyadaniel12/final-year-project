import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';

export const submitFeedback = async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { branchId, batchNumber, productId, rating, feedbackText, isCritical, customerName } = req.body;

    if (!rating) {
      return res.status(400).json({ error: 'Rating is required' });
    }

    // Resolve product name from productId if available
    let productName = 'Unknown Product';
    if (productId) {
      const { data: product } = await supabase
        .from('products')
        .select('name')
        .eq('id', productId)
        .single();
      if (product) productName = product.name;
    }

    // Insert into the 'customer_feedbacks' table (matching the schema in create_customer_feedbacks.sql)
    const { data: feedback, error } = await supabase
      .from('customer_feedbacks')
      .insert([
        {
          customer_name: customerName || 'Anonymous',
          rating,
          feedback_text: feedbackText || '',
          batch_number: batchNumber || null,
          product_id: productId || null,
          branch_id: branchId || null,
          is_critical: isCritical || false
        }
      ])
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error submitting feedback:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    console.error('Server error submitting feedback:', error);
    res.status(500).json({ error: 'Server error submitting feedback' });
  }
};

export const resolveFeedback = async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = req.params;
    const { isResolved } = req.body;
    const resolverId = req.user.id;

    const { data, error } = await supabase
      .from('customer_feedbacks')
      .update({ 
        is_resolved: isResolved,
        resolved_at: isResolved ? new Date().toISOString() : null,
        resolved_by: isResolved ? resolverId : null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error on lookup:', error);
      return res.status(500).json({ error: `Database error: ${error.message || 'Unknown'}` });
    }

    res.json({ message: `Feedback marked as ${isResolved ? 'resolved' : 'unresolved'}`, feedback: data });
  } catch (error) {
    console.error('Server error resolving feedback:', error);
    res.status(500).json({ error: 'Server error resolving feedback' });
  }
};

export const getAllFeedback = async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();

    // Fetch all feedback from the 'customer_feedbacks' table
    const { data: feedbacks, error } = await supabase
      .from('customer_feedbacks')
      .select('*, branches(name), products(name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching feedback:', error);
      return res.json({ feedback: [] });
    }

    const feedbackList = (feedbacks || []).map(item => {
      const dateObj = new Date(item.created_at);
      const isCritical = item.rating <= 2;

      return {
        id: item.id,
        customerName: item.customer_name || 'Anonymous',
        branchName: item.branches?.name || 'N/A',
        branchId: item.branch_id,
        productName: item.products?.name || item.product_name || 'Generic Product',
        productId: item.product_id,
        batchNumber: item.batch_number || null,
        rating: item.rating,
        categories: item.categories || [],
        feedbackText: item.feedback_text || item.message || '',
        isCritical: item.is_critical || item.rating <= 2,
        isResolved: item.is_resolved || false,
        resolvedAt: item.resolved_at,
        date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        createdAt: item.created_at
      };
    });

    res.json({ feedback: feedbackList });
  } catch (error) {
    console.error('Server error fetching feedback:', error);
    res.status(500).json({ error: 'Server error fetching feedback' });
  }
};

export const exportFeedbackCSV = async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: feedbacks, error } = await supabase
      .from('customer_feedbacks')
      .select('*, branches(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const headers = ['Date', 'Customer', 'Branch', 'Rating', 'Feedback', 'Batch', 'Critical', 'Resolved'];
    const rows = (feedbacks || []).map(f => [
      new Date(f.created_at).toLocaleDateString(),
      f.customer_name,
      f.branches?.name || 'N/A',
      f.rating,
      `"${(f.feedback_text || '').replace(/"/g, '""')}"`,
      f.batch_number || '',
      f.is_critical ? 'Yes' : 'No',
      f.is_resolved ? 'Yes' : 'No'
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=feedback_report.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};
