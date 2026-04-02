import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';

export const submitFeedback = async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { branchId, batchNumber, productId, rating, categories, feedbackText, recommend, buyAgain, isCritical } = req.body;

    if (!branchId || !rating) {
      return res.status(400).json({ error: 'branchId and rating are required' });
    }

    const { data: feedback, error } = await supabase
      .from('customer_feedbacks')
      .insert([
        {
          branch_id: branchId,
          batch_number: batchNumber || null,
          product_id: productId || null,
          rating,
          categories: categories || [],
          feedback_text: feedbackText || null,
          recommend: recommend !== undefined ? recommend : null,
          buy_again: buyAgain || null,
          is_critical: isCritical || false
        }
      ])
      .select()
      .single();

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
