import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: "Do I need an account to browse products?",
    answer: "No! You can search our entire catalog, browse categories, and view detailed product information completely as a guest without creating an account."
  },
  {
    question: "How does the AI Assistant (Sakhi) work?",
    answer: "Sakhi acts as your personal shopper. By chatting with her, you can describe exactly what you're looking for, your budget, and any constraints, and she will recommend the best products for your needs. (Note: Using Sakhi requires a free account so she can remember your preferences)."
  },
  {
    question: "How do I save products for later?",
    answer: "You can click the Heart icon on any product to add it to your Wishlist. However, you will need to sign in or create a free account to ensure your wishlist is saved and accessible across all your devices."
  },
  {
    question: "Are the recommended products real?",
    answer: "Yes, every product recommended by Sakhi or found in our search is a real item available in our catalog, complete with actual pricing, brands, and ratings."
  },
  {
    question: "How do you personalize my shopping experience?",
    answer: "Once you create an account and interact with Sakhi, our system learns your brand preferences, price sensitivity, and style over time, ensuring future recommendations are increasingly tailored to you."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', padding: '60px 24px', fontFamily: 'var(--font-body)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '40px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '24px', textAlign: 'center' }}>
          Frequently Asked Questions
        </h1>
        <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.6, textAlign: 'center', marginBottom: '60px' }}>
          Have questions? We're here to help you understand how Meesho Sakhi makes shopping effortless.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                style={{ 
                  background: 'var(--bg-card)', 
                  borderRadius: 'var(--radius-lg)', 
                  border: `1px solid ${isOpen ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                  overflow: 'hidden',
                  transition: 'border-color var(--transition-fast)'
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  style={{
                    width: '100%',
                    padding: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--text-primary)',
                    fontSize: '18px',
                    fontWeight: 600
                  }}
                >
                  {faq.question}
                  <div style={{ color: isOpen ? 'var(--brand-primary)' : 'var(--text-tertiary)' }}>
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>
                
                {isOpen && (
                  <div style={{ padding: '0 24px 24px 24px', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '16px' }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
