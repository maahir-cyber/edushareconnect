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

  // Reviews state with localStorage
  const [reviews, setReviews] = useState(() => {
    const savedReviews = localStorage.getItem('edushare_reviews');
    return savedReviews ? JSON.parse(savedReviews) : [
      { id: '1', name: 'Rahul Sharma', course: 'Class 12 Science', text: 'EduShare Connect saved me so much money on my JEE prep books! Got NCERT books at half price.', rating: '⭐⭐⭐⭐⭐' },
      { id: '2', name: 'Priya Verma', course: 'B.Tech CSE', text: 'Amazing platform! Very easy to list unused textbooks and connect directly with campus students.', rating: '⭐⭐⭐⭐⭐' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('edushare_reviews', JSON.stringify(reviews));
  }, [reviews]);

  // Review Form State
  const [reviewName, setReviewName] = useState('');
  const [reviewCourse, setReviewCourse] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState('⭐⭐⭐⭐⭐');
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedConditionFilter, setSelectedConditionFilter] = useState('ALL');

  // Direct Gmail Composing Modal State
  const [chatBook, setChatBook] = useState(null);
  const [chatMessage, setChatMessage] = useState('');

  // Check if current user is admin
  const isAdmin = currentUserEmail.trim().toLowerCase() === 'admin@edushare.ac.in';

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
            { id: '1', title: 'NCERT Mathematics Class 12', author: 'NCERT', course: 'CLASS12-MATH', originalPrice: 150, listPrice: 70, condition: 'Like New', seller: 'rahul@st.du.ac.in', location: 'Main Library' },
            { id: '2', title: 'Concepts of Physics Vol 1', author: 'H.C. Verma', course: 'BTECH-PHY101', originalPrice: 450, listPrice: 200, condition: 'Good', seller: 'priya@iitd.ac.in', location: 'Campus Gate 1' }
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

  // Form State for Wishlist Alert
  const [wishlistCourse, setWishlistCourse] = useState('');
  const [wishlistSubject, setWishlistSubject] = useState('');
  const [wishlistMaxPrice, setWishlistMaxPrice] = useState('');
  const [wishlistNotes, setWishlistNotes] = useState('');
  const [wishlistSuccessMsg, setWishlistSuccessMsg] = useState('');
  const [wishlistErrorMsg, setWishlistErrorMsg] = useState('');

  // Form State for Listing a Book
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formCourse, setFormCourse] = useState('');
  const [formOriginalPrice, setFormOriginalPrice] = useState('');
  const [formListPrice, setFormListPrice] = useState('');
  const [formCondition, setFormCondition] = useState('Good');
  const [formLocation, setFormLocation] = useState('');
  const [formSeller, setFormSeller] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-sync form seller email when logged in
  useEffect(() => {
    if (currentUserEmail) {
      setFormSeller(currentUserEmail);
    }
  }, [currentUserEmail]);

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
      const loggedEmail = loginEmail.trim();
      setCurrentUserEmail(loggedEmail);
      setFormSeller(loggedEmail);
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
      setCurrentUserEmail('');
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

    const sellerEmail = formSeller ? formSeller.trim() : currentUserEmail;

    if (!sellerEmail) {
      setErrorMsg('Please provide a valid institutional email address.');
      return;
    }

    const newBookData = {
      title: formTitle,
      author: formAuthor,
      course: formCourse.toUpperCase(),
      originalPrice: orig,
      listPrice: listed,
      condition: formCondition,
      location: formLocation || 'Main Campus Library',
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
      setFormLocation('');
      setFormSeller(currentUserEmail);
    } catch (error) {
      console.error("Error adding document: ", error);
      setErrorMsg('Failed to save listing to cloud database.');
    }
  };

  // Handle deleting a book with security check (owner or admin can delete)
  const handleDeleteBook = async (bookId, bookSeller) => {
    const isOwner = bookSeller && bookSeller.toLowerCase() === currentUserEmail.toLowerCase();
    
    if (!isOwner && !isAdmin) {
      alert("Unauthorized: You can only delete your own book listings unless you are the admin!");
      return;
    }

    if (window.confirm(isAdmin ? "Admin Action: Are you sure you want to remove this book transaction/listing?" : "Are you sure you want to remove your book listing?")) {
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

  // Handle adding wishlist alert form
  const handleAddWishlistForm = (e) => {
    e.preventDefault();
    setWishlistErrorMsg('');
    setWishlistSuccessMsg('');

    if (!wishlistCourse) {
      setWishlistErrorMsg('Please enter a valid course code.');
      return;
    }

    const formattedCode = wishlistCourse.toUpperCase();
    if (!preferences.includes(formattedCode)) {
      setPreferences([...preferences, formattedCode]);
      setWishlistSuccessMsg('Wishlist alert registered successfully! You will see matches in the marketplace.');
      setWishlistCourse('');
      setWishlistSubject('');
      setWishlistMaxPrice('');
      setWishlistNotes('');
    } else {
      setWishlistErrorMsg('This alert preference already exists.');
    }
  };

  // Handle publishing a student review
  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewName || !reviewText) {
      alert('Please fill out your name and review message.');
      return;
    }

    const newReview = {
      id: Date.now().toString(),
      name: reviewName,
      course: reviewCourse || 'Student',
      text: reviewText,
      rating: reviewRating
    };

    setReviews([newReview, ...reviews]);
    setReviewSuccessMsg('Review published successfully! Thank you for sharing your feedback.');
    setReviewName('');
    setReviewCourse('');
    setReviewText('');
  };

  const removePreference = (pref) => {
    setPreferences(preferences.filter(p => p !== pref));
  };

  // Helper function to calculate affordability badge status based on price
  const getAffordabilityTag = (price) => {
    if (price <= 100) return { label: '🔥 Ultra Budget Friendly', color: '#27ae60' };
    if (price <= 250) return { label: '💡 Very Affordable', color: '#2980b9' };
    return { label: '📚 Standard Value', color: '#8e44ad' };
  };

  // Count active wishlist matches
  const matchedWishlistBooks = books.filter(b => preferences.includes(b.course));
  const wishlistMatchCount = matchedWishlistBooks.length;

  // Filter books based on search query, category pills, and condition dropdown
  const filteredBooks = books.filter(book => {
    const query = searchQuery.toLowerCase();
    const matchesQuery = (
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.course.toLowerCase().includes(query)
    );

    let matchesCategory = true;
    if (selectedCategoryFilter === 'CLASS') matchesCategory = book.course.includes('CLASS');
    if (selectedCategoryFilter === 'BTECH') matchesCategory = book.course.includes('BTECH');

    let matchesCondition = true;
    if (selectedConditionFilter !== 'ALL') matchesCondition = book.condition === selectedConditionFilter;

    return matchesQuery && matchesCategory && matchesCondition;
  });

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
                  placeholder="student@college.ac.in (or admin@edushare.ac.in)" 
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
        <div className="logo">📚 EduShareConnect India {isAdmin && '⭐ [ADMIN PORTAL]' }</div>
        <nav className="nav-links">
          <button className={activeTab === 'feed' ? 'active' : ''} onClick={() => setItemsTab('feed')}>Marketplace</button>
          <button className={activeTab === 'sell' ? 'active' : ''} onClick={() => setItemsTab('sell')}>Sell a Book</button>
          <button className={activeTab === 'preferences' ? 'active' : ''} onClick={() => setItemsTab('preferences')}>
            Wishlist {wishlistMatchCount > 0 && <span style={{ background: '#e74c3c', color: 'white', padding: '1px 6px', borderRadius: '10px', fontSize: '0.75rem', marginLeft: '5px' }}>{wishlistMatchCount}</span>}
          </button>
          <button className={activeTab === 'reviews' ? 'active' : ''} onClick={() => setItemsTab('reviews')}>Reviews</button>
          <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setItemsTab('profile')}>My Profile</button>
          {isAdmin && (
            <button className={activeTab === 'admin' ? 'active' : ''} onClick={() => setItemsTab('admin')} style={{ background: '#d35400', color: 'white' }}>
              Admin Transactions
            </button>
          )}
          <button onClick={handleLogout} style={{ background: '#e74c3c', color: 'white' }}>Logout</button>
        </nav>
      </header>

      <main className="content">
        <div style={{ background: '#fff', padding: '10px 15px', borderRadius: '6px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '0.9rem', color: '#555' }}>
            Logged in as: <strong>{currentUserEmail}</strong> {isAdmin && <span style={{ color: '#d35400', fontWeight: 'bold' }}>(Administrator)</span>}
          </span>
        </div>

        {/* Wishlist Match Notification Banner */}
        {activeTab === 'feed' && wishlistMatchCount > 0 && (
          <div style={{ background: '#e3f2fd', borderLeft: '4px solid #2196f3', padding: '12px 16px', borderRadius: '4px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: '#0d47a1' }}>
              🎯 <strong>Wishlist Alert!</strong> You have <strong>{wishlistMatchCount}</strong> available book(s) matching your saved course alerts. Look for the orange badge!
            </span>
          </div>
        )}

        {/* Global Search Bar Toolbar, Category Pills & Condition Filter */}
        {activeTab === 'feed' && (
          <div style={{ marginBottom: '20px' }}>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="🔍 Search textbooks by title, author, or course code (e.g. Mathematics, Physics, CLASS12)..." 
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', boxSizing: 'border-box', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}
            />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setSelectedCategoryFilter('ALL')} 
                  style={{ padding: '6px 14px', borderRadius: '16px', border: 'none', background: selectedCategoryFilter === 'ALL' ? '#3f51b5' : '#e0e0e0', color: selectedCategoryFilter === 'ALL' ? '#fff' : '#333', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                >
                  All Books
                </button>
                <button 
                  onClick={() => setSelectedCategoryFilter('CLASS')} 
                  style={{ padding: '6px 14px', borderRadius: '16px', border: 'none', background: selectedCategoryFilter === 'CLASS' ? '#3f51b5' : '#e0e0e0', color: selectedCategoryFilter === 'CLASS' ? '#fff' : '#333', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                >
                  School / Board (CLASS)
                </button>
                <button 
                  onClick={() => setSelectedCategoryFilter('BTECH')} 
                  style={{ padding: '6px 14px', borderRadius: '16px', border: 'none', background: selectedCategoryFilter === 'BTECH' ? '#3f51b5' : '#e0e0e0', color: selectedCategoryFilter === 'BTECH' ? '#fff' : '#333', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                >
                  University / B.Tech
                </button>
              </div>

              <div>
                <select 
                  value={selectedConditionFilter} 
                  onChange={(e) => setSelectedConditionFilter(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem', background: '#fff' }}
                >
                  <option value="ALL">Filter by Condition: All</option>
                  <option value="Like New">Like New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'feed' && (
          <div className="feed-section">
            <h2>Indian Academic Book Marketplace</h2>
            <p className="subtitle">Cloud-synced listings featuring NCERT and University textbooks at a <strong>minimum 50% discount</strong>.</p>
            
            {loading ? (
              <p>Loading books from cloud database...</p>
            ) : filteredBooks.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#777', padding: '30px' }}>No textbooks match your search query or filter.</p>
            ) : (
              <div className="book-grid">
                {filteredBooks.map((book) => {
                  const discountPercent = Math.round(((book.originalPrice - book.listPrice) / book.originalPrice) * 100);
                  const isMatched = preferences.includes(book.course);
                  const isOwner = book.seller && book.seller.toLowerCase() === currentUserEmail.toLowerCase();
                  const canDelete = isOwner || isAdmin;
                  const affordability = getAffordabilityTag(book.listPrice);

                  return (
                    <div key={book.id} className={`book-card ${isMatched ? 'matched-card' : ''}`}>
                      {isMatched && <span className="match-badge">🎯 Wishlist Match!</span>}
                      
                      {canDelete && (
                        <button className="delete-btn" onClick={() => handleDeleteBook(book.id, book.seller)} title={isAdmin ? "Admin Delete Transaction" : "Remove My Listing"}>
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

                      {/* Affordability Feature Badge */}
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', background: affordability.color, color: 'white', fontWeight: 'bold', display: 'inline-block' }}>
                          {affordability.label}
                        </span>
                      </div>

                      <p className="condition">Condition: <strong>{book.condition}</strong></p>
                      <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '5px' }}>📍 Pickup: <strong>{book.location || 'Main Library'}</strong></p>
                      <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px' }}>Seller: {book.seller}</p>
                      <button className="contact-btn" onClick={() => { setChatBook(book); setChatMessage(`Hi, I am interested in buying your textbook "${book.title}" (${book.course}) listed for ₹${book.listPrice}. Is it still available for pickup at ${book.location || 'Main Library'}?`); }}>
                        Open Gmail to Seller ✉️
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Direct Gmail Composing Modal */}
        {chatBook && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', width: '440px', maxWidth: '90%', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#d93025' }}>✉️ Compose Gmail to Seller</h3>
              <p style={{ fontSize: '0.9rem', color: '#555', margin: '0 0 15px 0' }}>
                Book: <strong>{chatBook.title}</strong><br />
                To: <strong style={{ color: '#1a73e8' }}>{chatBook.seller}</strong><br />
                Pickup Location: <strong>{chatBook.location || 'Main Library'}</strong>
              </p>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}>Editable Email Message Draft</label>
                <textarea 
                  value={chatMessage} 
                  onChange={(e) => setChatMessage(e.target.value)} 
                  rows="5"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '0.9rem', fontFamily: 'inherit' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <a 
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(chatBook.seller)}&su=${encodeURIComponent(`Inquiry: ${chatBook.title} (${chatBook.course}) on EduShare Connect`)}&body=${encodeURIComponent(chatMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setChatBook(null)}
                  style={{ background: '#d93025', color: 'white', textDecoration: 'none', padding: '10px 18px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  Launch Gmail Web 🚀
                </a>
                <button 
                  onClick={() => setChatBook(null)} 
                  style={{ background: '#f1f3f4', color: '#3c4043', border: '1px solid #dadce0', padding: '10px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Cancel
                </button>
              </div>
            </div>
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
                <label>Campus Pickup Location (Type custom address)</label>
                <input 
                  type="text" 
                  value={formLocation} 
                  onChange={(e) => setFormLocation(e.target.value)} 
                  placeholder="e.g. Main Campus Library, Gate No. 2, Hostel 4..." 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Institutional Email (School/College)</label>
                <input 
                  type="email" 
                  value={formSeller} 
                  onChange={(e) => setFormSeller(e.target.value)} 
                  placeholder="student@college.ac.in" 
                  required 
                />
              </div>
              <button type="submit" className="submit-btn">Publish to Cloud (Enforce 50%+ Discount)</button>
            </form>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="form-section">
            <h2>Create Wishlist & Alert Profile</h2>
            <p className="subtitle">Fill out this form to submit your required course code and get instantly matched when discounted books are listed.</p>

            {wishlistErrorMsg && <div className="alert error">{wishlistErrorMsg}</div>}
            {wishlistSuccessMsg && <div className="alert success">{wishlistSuccessMsg}</div>}

            <form onSubmit={handleAddWishlistForm} className="book-form">
              <div className="form-group">
                <label>Course / Subject Code</label>
                <input 
                  type="text" 
                  value={wishlistCourse} 
                  onChange={(e) => setWishlistCourse(e.target.value)} 
                  placeholder="e.g. CLASS10-SCI or BTECH-CSE101" 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Subject Title / Textbook Name</label>
                <input 
                  type="text" 
                  value={wishlistSubject} 
                  onChange={(e) => setWishlistSubject(e.target.value)} 
                  placeholder="e.g. Science Textbook for Class 10" 
                />
              </div>
              <div className="form-group">
                <label>Maximum Target Price (₹)</label>
                <input 
                  type="number" 
                  value={wishlistMaxPrice} 
                  onChange={(e) => setWishlistMaxPrice(e.target.value)} 
                  placeholder="e.g. 200" 
                />
              </div>
              <div className="form-group">
                <label>Additional Notes / Edition Required</label>
                <textarea 
                  value={wishlistNotes} 
                  onChange={(e) => setWishlistNotes(e.target.value)} 
                  placeholder="e.g. Prefer latest publication year" 
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }}
                  rows="3"
                ></textarea>
              </div>
              <button type="submit" className="submit-btn">Save Wishlist Alert Profile</button>
            </form>

            <div style={{ marginTop: '30px' }}>
              <h3>Your Active Wishlist Alerts:</h3>
              <div className="pref-tags" style={{ marginTop: '10px' }}>
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
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="feed-section">
            <h2>Student Reviews & Success Stories</h2>
            <p className="subtitle">Read what other students are saying or write your own review about sharing and buying textbooks.</p>

            {reviewSuccessMsg && <div className="alert success">{reviewSuccessMsg}</div>}

            <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ marginTop: 0, color: '#1a237e' }}>✍️ Write a Review</h3>
              <form onSubmit={handleReviewSubmit} className="book-form">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>Your Name</label>
                    <input type="text" value={reviewName} onChange={(e) => setReviewName(e.target.value)} placeholder="Rahul Sharma" required />
                  </div>
                  <div className="form-group">
                    <label>Class / Course</label>
                    <input type="text" value={reviewCourse} onChange={(e) => setReviewCourse(e.target.value)} placeholder="Class 12 / B.Tech" required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Rating</label>
                  <select value={reviewRating} onChange={(e) => setReviewRating(e.target.value)}>
                    <option value="⭐⭐⭐⭐⭐">⭐⭐⭐⭐⭐ (5/5)</option>
                    <option value="⭐⭐⭐⭐">⭐⭐⭐⭐ (4/5)</option>
                    <option value="⭐⭐⭐">⭐⭐⭐ (3/5)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Your Feedback / Experience</label>
                  <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Share how EduShare Connect helped you..." rows="3" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }} required></textarea>
                </div>
                <button type="submit" className="submit-btn" style={{ width: 'auto', padding: '10px 20px' }}>Publish Review</button>
              </form>
            </div>

            <h3>Community Feedback:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '15px' }}>
              {reviews.map((rev) => (
                <div key={rev.id} style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <strong>{rev.name}</strong>
                    <span style={{ fontSize: '0.8rem', background: '#e8eaf6', color: '#3f51b5', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>{rev.course}</span>
                  </div>
                  <div style={{ marginBottom: '10px', fontSize: '0.9rem' }}>{rev.rating}</div>
                  <p style={{ margin: 0, color: '#555', fontSize: '0.95krn', lineHeight: '1.4' }}>"{rev.text}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="feed-section">
            <h2>My User Profile & Activity Summary</h2>
            <p className="subtitle">Account overview for <strong>{currentUserEmail}</strong></p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#3f51b5' }}>📦 Active Listings</h3>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0', color: '#333' }}>
                  {books.filter(b => b.seller && b.seller.toLowerCase() === currentUserEmail.toLowerCase()).length}
                </p>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#3f51b5' }}>🎯 Wishlist Alerts</h3>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0', color: '#333' }}>{preferences.length}</p>
              </div>
            </div>

            <h3>Your Shared Book Listings:</h3>
            <div className="book-grid" style={{ marginTop: '15px' }}>
              {books.filter(b => b.seller && b.seller.toLowerCase() === currentUserEmail.toLowerCase()).length === 0 ? (
                <p style={{ color: '#777' }}>You have not listed any textbooks yet. Head over to "Sell a Book" to share one!</p>
              ) : (
                books.filter(b => b.seller && b.seller.toLowerCase() === currentUserEmail.toLowerCase()).map(book => (
                  <div key={book.id} className="book-card">
                    <button className="delete-btn" onClick={() => handleDeleteBook(book.id, book.seller)} title="Remove My Listing">
                      &times;
                    </button>
                    <div className="course-tag">{book.course}</div>
                    <h3>{book.title}</h3>
                    <p className="author">by {book.author}</p>
                    <div className="pricing">
                      <span className="list-price">₹{book.listPrice}</span>
                    </div>
                    <p className="condition">Condition: <strong>{book.condition}</strong></p>
                    <p style={{ fontSize: '0.8rem', color: '#555' }}>📍 Pickup: <strong>{book.location || 'Main Library'}</strong></p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {isAdmin && activeTab === 'admin' && (
          <div className="feed-section">
            <h2>Admin Platform Dashboard & Statistics</h2>
            <p className="subtitle">Overview of platform metrics, textbook transactions, and sold/shared books inventory.</p>
            
            {/* Admin Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', borderLeft: '4px solid #3f51b5' }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#555', fontSize: '0.9rem' }}>Total Books Listed / Sold</h4>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0', color: '#1a237e' }}>{books.length}</p>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', borderLeft: '4px solid #27ae60' }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#555', fontSize: '0.9rem' }}>Total Marketplace Value</h4>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0', color: '#2e7d32' }}>
                  ₹{books.reduce((acc, curr) => acc + (Number(curr.listPrice) || 0), 0)}
                </p>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', borderLeft: '4px solid #e67e22' }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#555', fontSize: '0.9rem' }}>Published Reviews</h4>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0', color: '#d35400' }}>{reviews.length}</p>
              </div>
            </div>

            {loading ? (
              <p>Loading transactions...</p>
            ) : (
              <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <h3 style={{ marginTop: 0, color: '#1a237e' }}>Active Cloud Book Transactions</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '15px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #ddd', color: '#555' }}>
                      <th style={{ padding: '10px' }}>Course Code</th>
                      <th style={{ padding: '10px' }}>Book Title</th>
                      <th style={{ padding: '10px' }}>Seller Email Address</th>
                      <th style={{ padding: '10px' }}>List Price</th>
                      <th style={{ padding: '10px' }}>Pickup Location</th>
                      <th style={{ padding: '10px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((book) => (
                      <tr key={book.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{book.course}</td>
                        <td style={{ padding: '10px' }}>{book.title}</td>
                        <td style={{ padding: '10px', color: '#666' }}>{book.seller}</td>
                        <td style={{ padding: '10px', color: '#2e7d32', fontWeight: 'bold' }}>₹{book.listPrice}</td>
                        <td style={{ padding: '10px' }}>{book.location || 'Main Library'}</td>
                        <td style={{ padding: '10px' }}>
                          <button 
                            onClick={() => handleDeleteBook(book.id, book.seller)} 
                            style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            Delete Transaction
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

export default App;