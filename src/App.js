import React, { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const auth = getAuth();

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  const [activeTab, setItemsTab] = useState('feed');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch books from Firebase Cloud Firestore on page load
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchBooks = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "books"));
        const booksList = querySnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        
        if (booksList.length > 0) {
          setBooks(booksList);
        } else {
          setBooks([
            { id: '1', title: 'NCERT Mathematics Class 12', author: 'NCERT', course: 'CLASS12-MATH', originalPrice: 150, listPrice: 70, condition: 'Like New', seller: 'rahul@st.du.ac.in' },
            { id: '2', title: 'Concepts of Physics Vol 1', author: 'H.C. Verma', course: 'BTECH-PHY101', originalPrice: 450, listPrice: 200, condition: 'Good', seller: 'priya@iitd.ac.in' }
          ]);
        }
      } catch (error) {
        console.error("Error fetching books: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [isLoggedIn]);

  // Preferences state with localStorage
  const [preferences, setPreferences] = useState(() => {
    const savedPrefs = localStorage.getItem('edushare_prefs');
    return savedPrefs ? JSON.parse(savedPrefs) : ['CLASS12-MATH', 'BTECH-PHY101'];
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

  // Handle Secure Authentication (Login or Sign Up)
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignUpMode) {
        await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
        alert("Account created successfully! You are now logged in.");
      } else {
        await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      }
      setCurrentUserEmail(loginEmail.trim());
      setIsLoggedIn(true);
    } catch (error) {
      alert("Authentication Error: " + error.message);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      setLoginPassword('');
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  // Handle listing submission to Firebase Cloud
  const handleListBook = async (e) => {
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

    if (listed > maxAllowedPrice) {
      setErrorMsg(`Policy Error: Max allowed price for a ₹${orig} book is ₹${maxAllowedPrice.toFixed(2)} (Minimum 50% discount required).`);
      return;
    }

    const sellerEmail = formSeller || currentUserEmail;

    const newBookData = {
      title: formTitle,
      author: formAuthor,
      course: formCourse.toUpperCase(),
      originalPrice: orig,
      listPrice: listed,
      condition: formCondition,
      seller: sellerEmail,
      createdAt: serverTimestamp()
    };

    try {
      const docRef = await addDoc(collection(db, "books"), newBookData);
      const addedBook = { id: docRef.id, ...newBookData };
      
      setBooks([addedBook, ...books]);
      setSuccessMsg('Book listed live on the cloud! Visible instantly on all connected PCs.');
      
      setFormTitle('');
      setFormAuthor('');
      setFormCourse('');
      setFormOriginalPrice('');
      setFormListPrice('');
      setFormSeller('');
    } catch (error) {
      console.error("Error adding document: ", error);
      setErrorMsg('Failed to save listing to cloud database.');
    }
  };

  // Handle deleting a book with security check (only owner can delete)
  const handleDeleteBook = async (bookId, bookSeller) => {
    if (bookSeller && bookSeller.toLowerCase() !== currentUserEmail.toLowerCase()) {
      alert("Unauthorized: You can only delete your own book listings!");
      return;
    }

    if (window.confirm("Are you sure you want to remove your book listing?")) {
      try {
        if (bookId.length > 5) {
          await deleteDoc(doc(db, "books", bookId));
        }
        setBooks(books.filter(book => book.id !== bookId));
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Failed to delete the listing from the database.");
      }
    }
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

  // If user is not logged in, show Background Image View & Auth View
  if (!isLoggedIn) {
    return (
      <div className="login-page-wrapper">
        <div className="login-container">
          
          <div className="scrollable-hero-card">
            <div className="hero-badge">✨ Empowering Education Through Collaboration</div>
            <h1 className="hero-title">EDUSHARE CONNECT</h1>
            
            <div className="scroll-content-box">
              <div className="vision-mission-block">
                <h3>👁️ VISION</h3>
                <p>To create a global ecosystem where quality education is accessible, collaborative, and personalized for every learner everywhere.</p>
              </div>

              <div className="vision-mission-block">
                <h3>🚀 MISSION</h3>
                <p>To connect students, mentors, and resources seamlessly, fostering a dynamic community that facilitates knowledge sharing, mentorship, and interactive learning.</p>
              </div>

              <div className="vision-mission-block">
                <h3>👥 ABOUT US</h3>
                <p>EduShare Connect is an innovative platform empowering learners to collaborate, share knowledge, and access mentorship. We build bridges for academic and personal growth.</p>
              </div>
            </div>
            <p className="scroll-hint">⬇️ Scroll inside to read more & sign in below ⬇️</p>
          </div>

          <div className="login-card">
            <h2>{isSignUpMode ? '📝 Create Account' : '🔐 Secure Portal Sign-In'}</h2>
            <p className="subtitle">{isSignUpMode ? 'Register with a secure password.' : 'Enter your email & correct password.'}</p>
            
            <form onSubmit={handleAuthSubmit} className="book-form">
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={loginEmail} 
                  onChange={(e) => setLoginEmail(e.target.value)} 
                  placeholder="student@college.ac.in" 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  value={loginPassword} 
                  onChange={(e) => setLoginPassword(e.target.value)} 
                  placeholder="••••••••" 
                  required 
                />
              </div>
              <button type="submit" className="submit-btn">
                {isSignUpMode ? 'Register Account 🚀' : 'Login / Sign In 🚀'}
              </button>
            </form>

            <p style={{ marginTop: '15px', fontSize: '0.85rem', textAlign: 'center' }}>
              {isSignUpMode ? 'Already have an account? ' : "Don't have an account? "}
              <button 
                type="button" 
                onClick={() => setIsSignUpMode(!isSignUpMode)} 
                style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
              >
                {isSignUpMode ? 'Login here' : 'Sign up here'}
              </button>
            </p>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="navbar">
        <div className="logo">📚 EduShareConnect India</div>
        <nav className="nav-links">
          <button className={activeTab === 'feed' ? 'active' : ''} onClick={() => setItemsTab('feed')}>Marketplace</button>
          <button className={activeTab === 'sell' ? 'active' : ''} onClick={() => setItemsTab('sell')}>Sell a Book</button>
          <button className={activeTab === 'preferences' ? 'active' : ''} onClick={() => setItemsTab('preferences')}>My Wishlist Alerts</button>
          <button onClick={handleLogout} style={{ background: '#e74c3c', color: 'white' }}>Logout</button>
        </nav>
      </header>

      <main className="content">
        <div style={{ background: '#fff', padding: '10px 15px', borderRadius: '6px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '0.9rem', color: '#555' }}>Logged in as: <strong>{currentUserEmail}</strong></span>
        </div>
        
        {activeTab === 'feed' && (
          <div className="feed-section">
            <h2>Indian Academic Book Marketplace</h2>
            <p className="subtitle">Cloud-synced listings featuring NCERT and University textbooks at a <strong>minimum 50% discount</strong>.</p>
            
            {loading ? (
              <p>Loading books from cloud database...</p>
            ) : (
              <div className="book-grid">
                {books.map((book) => {
                  const discountPercent = Math.round(((book.originalPrice - book.listPrice) / book.originalPrice) * 100);
                  const isMatched = preferences.includes(book.course);
                  const isOwner = book.seller && book.seller.toLowerCase() === currentUserEmail.toLowerCase();

                  return (
                    <div key={book.id} className={`book-card ${isMatched ? 'matched-card' : ''}`}>
                      {isMatched && <span className="match-badge">🎯 Wishlist Match!</span>}
                      
                      {isOwner && (
                        <button className="delete-btn" onClick={() => handleDeleteBook(book.id, book.seller)} title="Remove My Listing">
                          &times;
                        </button>
                      )}

                      <div className="course-tag">{book.course}</div>
                      <h3>{book.title}</h3>
                      <p className="author">by {book.author}</p>
                      <div className="pricing">
                        <span className="original-price">₹{book.originalPrice}</span>
                        <span className="list-price">₹{book.listPrice}</span>
                        <span className="discount-tag">{discountPercent}% OFF</span>
                      </div>
                      <p className="condition">Condition: <strong>{book.condition}</strong></p>
                      <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px' }}>Seller: {book.seller}</p>
                      <button className="contact-btn" onClick={() => alert(`Connecting with seller: ${book.seller}\nArrange campus pickup or local delivery.`)}>
                        Contact Seller
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sell' && (
          <div className="form-section">
            <h2>List Your Unused Textbook</h2>
            <p className="subtitle">Listings go straight to the cloud database under your email. Max price cannot exceed 50% of MRP.</p>
            
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
                <input type="email" value={formSeller || currentUserEmail} onChange={(e) => setFormSeller(e.target.value)} placeholder="student@college.ac.in" required />
              </div>
              <button type="submit" className="submit-btn">Publish to Cloud (Enforce 50%+ Discount)</button>
            </form>
          </div>
        )}

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