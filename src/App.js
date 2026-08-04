import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('feed');
  
  // Load initial books from localStorage if available, otherwise use default mock books
  const [books, setBooks] = useState(() => {
    const savedBooks = localStorage.getItem('edushare_books');
    if (savedBooks) {
      return JSON.parse(savedBooks);
    }
    return [
      { id: 1, title: 'NCERT Mathematics Class 12', author: 'NCERT', course: 'CLASS12-MATH', originalPrice: 150, listPrice: 70, condition: 'Like New', seller: 'rahul@st.du.ac.in' },
      { id: 2, title: 'Concepts of Physics Vol 1', author: 'H.C. Verma', course: 'BTECH-PHY101', originalPrice: 450, listPrice: 200, condition: 'Good', seller: 'priya@iitd.ac.in' },
      { id: 3, title: 'NCERT Science Class 10', author: 'NCERT', course: 'CLASS10-SCI', originalPrice: 120, listPrice: 50, condition: 'Fair', seller: 'amit@school.edu.in' }
    ];
  });

  // Save books to localStorage whenever the books array changes
  useEffect(() => {
    localStorage.setItem('edushare_books', JSON.stringify(books));
  }, [books]);

  // Load preferences from localStorage
  const [preferences, setPreferences] = useState(() => {
    const savedPrefs = localStorage.getItem('edushare_prefs');
    if (savedPrefs) {
      return JSON.parse(savedPrefs);
    }
    return ['CLASS12-MATH', 'BTECH-PHY101'];
  });

  useEffect(() => {
    localStorage.setItem('edushare_prefs', JSON.stringify(preferences));
  }, [preferences]);

  const [newPref, setNewPref] = useState('');

  // Form State for Listing a Book
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formCourse, setFormCourse] = useState('');
  const [formOriginalPrice, setFormOriginalPrice] = useState('');
  const [formListPrice, setFormListPrice] = useState('');
  const [formCondition, setFormCondition] = useState('Good');
  const [formSeller, setFormSeller] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle listing submission with 50% discount enforcement rule
  const handleListBook = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const orig = parseFloat(formOriginalPrice);
    const listed = parseFloat(formListPrice);

    if (isNaN(orig) || isNaN(listed)) {
      setErrorMsg('Please enter valid numeric prices in ₹.');
      return;
    }

    const maxAllowedPrice = orig * 0.5;

    // Guardrail Enforcement: Price must be at or below 50% of original
    if (listed > maxAllowedPrice) {
      setErrorMsg(`Policy Error: Max allowed price for a ₹${orig} book is ₹${maxAllowedPrice.toFixed(2)} (Minimum 50% discount required).`);
      return;
    }

    const newBook = {
      id: Date.now(),
      title: formTitle,
      author: formAuthor,
      course: formCourse.toUpperCase(),
      originalPrice: orig,
      listPrice: listed,
      condition: formCondition,
      seller: formSeller || 'student@college.edu.in'
    };

    setBooks([newBook, ...books]);
    setSuccessMsg('Book listed successfully! Needy students with matching preferences have been notified.');
    
    // Clear form
    setFormTitle('');
    setFormAuthor('');
    setFormCourse('');
    setFormOriginalPrice('');
    setFormListPrice('');
    setFormSeller('');
  };

  const addPreference = (e) => {
    e.preventDefault();
    if (newPref && !preferences.includes(newPref.toUpperCase())) {
      setPreferences([...preferences, newPref.toUpperCase()]);
      setNewPref('');
    }
  };

  const removePreference = (pref) => {
    setPreferences(preferences.filter(p => p !== pref));
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="navbar">
        <div className="logo">📚 EduShareConnect India</div>
        <nav className="nav-links">
          <button className={activeTab === 'feed' ? 'active' : ''} onClick={() => setActiveTab('feed')}>Marketplace</button>
          <button className={activeTab === 'sell' ? 'active' : ''} onClick={() => setActiveTab('sell')}>Sell a Book</button>
          <button className={activeTab === 'preferences' ? 'active' : ''} onClick={() => setActiveTab('preferences')}>My Wishlist Alerts</button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="content">
        
        {/* TAB 1: MARKETPLACE FEED */}
        {activeTab === 'feed' && (
          <div className="feed-section">
            <h2>Indian Academic Book Marketplace</h2>
            <p className="subtitle">Featuring NCERT, State Board, and University textbooks at a <strong>minimum 50% discount</strong>.</p>
            
            <div className="book-grid">
              {books.map((book) => {
                const discountPercent = Math.round(((book.originalPrice - book.listPrice) / book.originalPrice) * 100);
                const isMatched = preferences.includes(book.course);

                return (
                  <div key={book.id} className={`book-card ${isMatched ? 'matched-card' : ''}`}>
                    {isMatched && <span className="match-badge">🎯 Wishlist Match!</span>}
                    <div className="course-tag">{book.course}</div>
                    <h3>{book.title}</h3>
                    <p className="author">by {book.author}</p>
                    <div className="pricing">
                      <span className="original-price">₹{book.originalPrice}</span>
                      <span className="list-price">₹{book.listPrice}</span>
                      <span className="discount-tag">{discountPercent}% OFF</span>
                    </div>
                    <p className="condition">Condition: <strong>{book.condition}</strong></p>
                    <button className="contact-btn" onClick={() => alert(`Connecting with seller: ${book.seller}\nArrange campus pickup or local delivery.`)}>
                      Contact Seller
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: SELL A BOOK */}
        {activeTab === 'sell' && (
          <div className="form-section">
            <h2>List Your Unused Textbook</h2>
            <p className="subtitle">Help fellow students save money. Listing price cannot exceed 50% of the MRP.</p>
            
            {errorMsg && <div className="alert error">{errorMsg}</div>}
            {successMsg && <div className="alert success">{successMsg}</div>}

            <form onSubmit={handleListBook} className="book-form">
              <div className="form-group">
                <label>Book Title (e.g., NCERT Physics Class 11)</label>
                <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. NCERT Biology Class 12" required />
              </div>
              <div className="form-group">
                <label>Author / Publisher</label>
                <input type="text" value={formAuthor} onChange={(e) => setFormAuthor(e.target.value)} placeholder="e.g. NCERT or R.D. Sharma" required />
              </div>
              <div className="form-group">
                <label>Class / Course Code</label>
                <input type="text" value={formCourse} onChange={(e) => setFormCourse(e.target.value)} placeholder="e.g. CLASS12-BIO or BTECH-CSE101" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Original MRP (₹)</label>
                  <input type="number" value={formOriginalPrice} onChange={(e) => setFormOriginalPrice(e.target.value)} placeholder="350" required />
                </div>
                <div className="form-group">
                  <label>Your Listing Price (₹)</label>
                  <input type="number" value={formListPrice} onChange={(e) => setFormListPrice(e.target.value)} placeholder="Max 50% of MRP" required />
                </div>
              </div>
              <div className="form-group">
                <label>Book Condition</label>
                <select value={formCondition} onChange={(e) => setFormCondition(e.target.value)}>
                  <option value="Like New">Like New (No highlighting/markings)</option>
                  <option value="Good">Good (Minor pencil notes)</option>
                  <option value="Fair">Fair (Worn cover, fully readable pages)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Institutional Email (School/College)</label>
                <input type="email" value={formSeller} onChange={(e) => setFormSeller(e.target.value)} placeholder="student@college.ac.in" required />
              </div>
              <button type="submit" className="submit-btn">Publish Listing (Enforce 50%+ Discount)</button>
            </form>
          </div>
        )}

        {/* TAB 3: PREFERENCES & WISHLIST */}
        {activeTab === 'preferences' && (
          <div className="preferences-section">
            <h2>Needy Student Wishlist & Alerts</h2>
            <p className="subtitle">Add your upcoming grade, board, or college course codes to get instantly notified when discounted books are listed.</p>

            <form onSubmit={addPreference} className="pref-form">
              <input 
                type="text" 
                value={newPref} 
                onChange={(e) => setNewPref(e.target.value)} 
                placeholder="Enter Code (e.g. CLASS10-SCI)" 
              />
              <button type="submit" className="add-btn">Add Alert</button>
            </form>

            <div className="pref-tags">
              <h3>Active Alerts:</h3>
              {preferences.length === 0 ? (
                <p>No preferences added yet.</p>
              ) : (
                preferences.map((pref) => (
                  <span key={pref} className="pref-tag">
                    {pref} <button onClick={() => removePreference(pref)}>&times;</button>
                  </span>
                ))
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;