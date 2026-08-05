import React, { useState, useEffect } from 'react';
import './App.css';
import { db, storage } from './firebase'; // Make sure storage is imported from your firebase config
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const auth = getAuth();

function App() {
  // Device Selection Screen State ('unselected', 'desktop', 'mobile')
  const [deviceMode, setDeviceMode] = useState('unselected');

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

  // In-App Chat Modal State
  const [chatBook, setChatBook] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');

  // Donations State with localStorage persistence
  const [donations, setDonations] = useState(() => {
    const savedDonations = localStorage.getItem('edushare_donations');
    return savedDonations ? JSON.parse(savedDonations) : [
      { id: 'd1', title: 'Old Chemistry Lab Manual & Notes', author: 'Department of Chemistry', course: 'BTECH-CHEM', condition: 'Good', donor: 'arjun@college.ac.in', location: 'Science Block' },
      { id: 'd2', title: 'Class 10 Foundation Mathematics', author: 'R.D. Sharma', course: 'CLASS10-MATH', condition: 'Fair', donor: 'sneha@school.edu', location: 'Main Gate' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('edushare_donations', JSON.stringify(donations));
  }, [donations]);

  const [donTitle, setDonTitle] = useState('');
  const [donAuthor, setDonAuthor] = useState('');
  const [donCourse, setDonCourse] = useState('');
  const [donCondition] = useState('Good');
  const [donLocation, setDonLocation] = useState('');
  const [donSuccessMsg, setDonSuccessMsg] = useState('');

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
            { id: '1', title: 'NCERT Mathematics Class 12', author: 'NCERT', course: 'CLASS12-MATH', originalPrice: 150, listPrice: 70, condition: 'Like New', seller: 'rahul@st.du.ac.in', location: 'Main Library', photo: '' },
            { id: '2', title: 'Concepts of Physics Vol 1', author: 'H.C. Verma', course: 'BTECH-PHY101', originalPrice: 450, listPrice: 200, condition: 'Good', seller: 'priya@iitd.ac.in', location: 'Campus Gate 1', photo: '' }
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

  // Preferences state with localStorage (Wishlist Alerts)
  const [preferences, setPreferences] = useState(() => {
    const savedPrefs = localStorage.getItem('edushare_prefs');
    return savedPrefs ? JSON.parse(savedPrefs) : ['CLASS12-MATH', 'BTECH-PHY101'];
  });

  useEffect(() => {
    localStorage.setItem('edushare_prefs', JSON.stringify(preferences));
  }, [preferences]);

  // Price Drop Notification banner state
  const [priceDropAlerts, setPriceDropAlerts] = useState([]);
  useEffect(() => {
    const matched = books.filter(b => preferences.includes(b.course) && Number(b.listPrice) <= 150);
    setPriceDropAlerts(matched);
  }, [books, preferences]);

  // Form State for Wishlist Alert
  const [wishlistCourse, setWishlistCourse] = useState('');
  const [wishlistSubject, setWishlistSubject] = useState('');
  const [wishlistMaxPrice, setWishlistMaxPrice] = useState('');
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
  
  // Robust image upload states
  const [formPhotoFile, setFormPhotoFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle local file selection, validation, and preview generation
  const handlePhotoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (must be an image)
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Please select a valid image file (JPEG, PNG, etc.).');
        return;
      }
      // Validate file size (limit to 5MB to prevent performance drops)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Image size must be less than 5MB.');
        return;
      }
      setErrorMsg('');
      setFormPhotoFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

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

  // Handle listing submission to Firebase Cloud (With Firebase Storage cloud image upload and fallback)
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

    const sellerEmail = formSeller ? formSeller.trim() : currentUserEmail;

    if (!sellerEmail) {
      setErrorMsg('Please provide a valid institutional email address.');
      return;
    }

    // If listing price is 0, shift it automatically to Donations / Giveaways instead of Marketplace
    if (listed === 0) {
      let finalPhotoUrl = '';
      if (formPhotoFile) {
        try {
          setUploadingImage(true);
          const storageRef = ref(storage, `book_images/${Date.now()}_${formPhotoFile.name}`);
          const snapshot = await uploadBytes(storageRef, formPhotoFile);
          finalPhotoUrl = await getDownloadURL(snapshot.ref);
        } catch (uploadErr) {
          console.warn("Firebase Storage upload failed, using local preview fallback for donation:", uploadErr);
          finalPhotoUrl = imagePreviewUrl;
        } finally {
          setUploadingImage(false);
        }
      }

      const newDonationItem = {
        id: Date.now().toString(),
        title: formTitle,
        author: formAuthor,
        course: formCourse.toUpperCase(),
        condition: formCondition,
        donor: sellerEmail,
        location: formLocation || 'Main Campus Library',
        photo: finalPhotoUrl
      };

      setDonations([newDonationItem, ...donations]);
      setSuccessMsg('🎉 Listing price was ₹0! Automatically shifted your book to Free Book Donations & Giveaways.');
      
      setFormTitle('');
      setFormAuthor('');
      setFormCourse('');
      setFormOriginalPrice('');
      setFormListPrice('');
      setFormLocation('');
      setFormPhotoFile(null);
      setImagePreviewUrl('');
      setFormSeller(currentUserEmail);
      return;
    }

    const maxAllowedPrice = orig * 0.5;

    if (listed > maxAllowedPrice) {
      setErrorMsg(`Policy Error: Max allowed price for a ₹${orig} book is ₹${maxAllowedPrice.toFixed(2)} (Minimum 50% discount required). Note: Setting the price to ₹0 automatically shifts it to Free Donations.`);
      return;
    }

    // Upload image to Firebase Storage if selected
    let uploadedPhotoUrl = '';
    if (formPhotoFile) {
      try {
        setUploadingImage(true);
        const storageRef = ref(storage, `book_images/${Date.now()}_${formPhotoFile.name}`);
        const snapshot = await uploadBytes(storageRef, formPhotoFile);
        uploadedPhotoUrl = await getDownloadURL(snapshot.ref);
      } catch (uploadErr) {
        console.warn("Firebase Storage upload failed, falling back to local base64/object URL:", uploadErr);
        // Fallback reader conversion so image is never lost even if storage rules/bucket aren't configured yet
        uploadedPhotoUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(formPhotoFile);
        });
      } finally {
        setUploadingImage(false);
      }
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
      photo: uploadedPhotoUrl || '',
      createdAt: serverTimestamp()
    };

    try {
      const docRef = await addDoc(collection(db, "books"), newBookData);
      const addedBook = { id: docRef.id, ...newBookData };
      
      setBooks([addedBook, ...books]);
      setSuccessMsg('Book listed live on the cloud with verified photo & wishlist notifications active!');
      
      setFormTitle('');
      setFormAuthor('');
      setFormCourse('');
      setFormOriginalPrice('');
      setFormListPrice('');
      setFormLocation('');
      setFormPhotoFile(null);
      setImagePreviewUrl('');
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

  // Handle deleting a free book donation / giveaway
  const handleDeleteDonation = (donId, donorEmail) => {
    const isOwner = donorEmail && donorEmail.toLowerCase() === currentUserEmail.toLowerCase();
    
    if (!isOwner && !isAdmin) {
      alert("Unauthorized: You can only delete your own free giveaways unless you are the admin!");
      return;
    }

    if (window.confirm("Are you sure you want to remove this free giveaway?")) {
      setDonations(donations.filter(item => item.id !== donId));
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
      setWishlistSuccessMsg('Wishlist alert & price drop notifications registered successfully!');
      setWishlistCourse('');
      setWishlistSubject('');
      setWishlistMaxPrice('');
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

  // Handle in-app messaging fetch & send
  useEffect(() => {
    if (!chatBook) return;
    const q = query(collection(db, "messages"), where("bookId", "==", chatBook.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      msgs.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
      setChatMessages(msgs.length > 0 ? msgs : [
        { id: 'm1', sender: chatBook.seller, text: `Hello! Thanks for your interest in "${chatBook.title}". Let me know when you can pick it up.`, createdAt: null }
      ]);
    });
    return () => unsubscribe();
  }, [chatBook]);

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !chatBook) return;

    try {
      await addDoc(collection(db, "messages"), {
        bookId: chatBook.id,
        sender: currentUserEmail,
        text: newMessageText,
        createdAt: serverTimestamp()
      });
      setNewMessageText('');
    } catch (err) {
      console.error("Error sending message:", err);
      // Fallback local append if offline
      setChatMessages([...chatMessages, { id: Date.now().toString(), sender: currentUserEmail, text: newMessageText }]);
      setNewMessageText('');
    }
  };

  // Calculate Badge System
  const userBookCount = books.filter(b => b.seller && b.seller.toLowerCase() === currentUserEmail.toLowerCase()).length;
  const userDonationCount = donations.filter(d => d.donor && d.donor.toLowerCase() === currentUserEmail.toLowerCase()).length;
  const totalUserContributions = userBookCount + userDonationCount;

  const getUserBadge = () => {
    if (totalUserContributions >= 5) return { title: '🌟 Elite Campus Donor & Seller', color: '#8e44ad' };
    if (totalUserContributions >= 2) return { title: '⭐ Active Contributor', color: '#2980b9' };
    if (totalUserContributions === 1) return { title: '🌱 Starter Seller', color: '#27ae60' };
    return { title: '📚 New Academic Explorer', color: '#7f8c8d' };
  };
  const currentBadge = getUserBadge();

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
    const queryStr = searchQuery.toLowerCase();
    const matchesQuery = (
      book.title.toLowerCase().includes(queryStr) ||
      book.author.toLowerCase().includes(queryStr) ||
      book.course.toLowerCase().includes(queryStr)
    );

    let matchesCategory = true;
    if (selectedCategoryFilter === 'CLASS') matchesCategory = book.course.includes('CLASS');
    if (selectedCategoryFilter === 'BTECH') matchesCategory = book.course.includes('BTECH');

    let matchesCondition = true;
    if (selectedConditionFilter !== 'ALL') matchesCondition = book.condition === selectedConditionFilter;

    return matchesQuery && matchesCategory && matchesCondition;
  });

  // DEVICE SELECTION SCREEN (Desktop vs Mobile)
  if (deviceMode === 'unselected') {
    return (
      <div className="login-page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)' }}>
        <div style={{ background: '#fff', padding: '40px', borderRadius: '12px', textAlign: 'center', maxWidth: '450px', width: '90%', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
          <h1 style={{ color: '#1a237e', marginBottom: '10px' }}>EDUSHARE CONNECT</h1>
          <p style={{ color: '#555', marginBottom: '30px', fontSize: '1rem' }}>Please select your viewing preference to optimize your experience:</p>
          
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button 
              onClick={() => setDeviceMode('desktop')} 
              style={{ flex: 1, padding: '15px 20px', borderRadius: '8px', border: '2px solid #3f51b5', background: '#3f51b5', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: '0.2s' }}
            >
              💻 Desktop View
            </button>
            <button 
              onClick={() => setDeviceMode('mobile')} 
              style={{ flex: 1, padding: '15px 20px', borderRadius: '8px', border: '2px solid #3f51b5', background: '#fff', color: '#3f51b5', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: '0.2s' }}
            >
              📱 Mobile View
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user is not logged in, show Background Image View & Auth View
  if (!isLoggedIn) {
    return (
      <div className="login-page-wrapper" style={{ maxWidth: deviceMode === 'mobile' ? '480px' : '100%', margin: deviceMode === 'mobile' ? '20px auto' : '0' }}>
        <div className="login-container" style={{ flexDirection: deviceMode === 'mobile' ? 'column' : 'row' }}>
          
          {/* Hero Card */}
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
            
            {/* IN MOBILE VIEW: RENDER LOGIN CARD RIGHT UNDER THE VISION / HERO CONTENT BOX */}
            {deviceMode === 'mobile' && (
              <div className="login-card" style={{ marginTop: '20px', width: '100%', boxSizing: 'border-box' }}>
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

                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                  <button onClick={() => setDeviceMode('unselected')} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}>
                    Switch Device Mode ({deviceMode})
                  </button>
                </div>

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
            )}

            <p className="scroll-hint">⬇️ Scroll inside to read more & sign in below ⬇️</p>
          </div>

          {/* IN DESKTOP VIEW: RENDER LOGIN CARD SIDE-BY-SIDE */}
          {deviceMode !== 'mobile' && (
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

              <div style={{ marginTop: '10px', textAlign: 'center' }}>
                <button onClick={() => setDeviceMode('unselected')} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}>
                  Switch Device Mode ({deviceMode})
                </button>
              </div>

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
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ maxWidth: deviceMode === 'mobile' ? '480px' : '100%', margin: deviceMode === 'mobile' ? '0 auto' : '0', boxShadow: deviceMode === 'mobile' ? '0 0 20px rgba(0,0,0,0.1)' : 'none' }}>
      <header className="navbar" style={{ flexDirection: deviceMode === 'mobile' ? 'column' : 'row', gap: deviceMode === 'mobile' ? '10px' : '0' }}>
        <div className="logo">📚 EduShareConnect {isAdmin && '⭐ [ADMIN]' }</div>
        <nav className="nav-links" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className={activeTab === 'feed' ? 'active' : ''} onClick={() => setItemsTab('feed')}>Marketplace</button>
          <button className={activeTab === 'sell' ? 'active' : ''} onClick={() => setItemsTab('sell')}>Sell Book</button>
          <button className={activeTab === 'donations' ? 'active' : ''} onClick={() => setItemsTab('donations')}>Donations 🎁</button>
          <button className={activeTab === 'preferences' ? 'active' : ''} onClick={() => setItemsTab('preferences')}>
            Wishlist {wishlistMatchCount > 0 && <span style={{ background: '#e74c3c', color: 'white', padding: '1px 6px', borderRadius: '10px', fontSize: '0.75rem', marginLeft: '5px' }}>{wishlistMatchCount}</span>}
          </button>
          <button className={activeTab === 'reviews' ? 'active' : ''} onClick={() => setItemsTab('reviews')}>Reviews</button>
          <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setItemsTab('profile')}>Profile</button>
          {isAdmin && (
            <button className={activeTab === 'admin' ? 'active' : ''} onClick={() => setItemsTab('admin')} style={{ background: '#d35400', color: 'white' }}>
              Admin
            </button>
          )}
          <button onClick={handleLogout} style={{ background: '#e74c3c', color: 'white' }}>Logout</button>
        </nav>
      </header>

      <main className="content">
        <div style={{ background: '#fff', padding: '10px 15px', borderRadius: '6px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '0.9rem', color: '#555' }}>
            User: <strong>{currentUserEmail}</strong> {isAdmin && <span style={{ color: '#d35400', fontWeight: 'bold' }}>(Admin)</span>}
          </span>
          <div>
            <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '12px', background: currentBadge.color, color: 'white', fontWeight: 'bold' }}>
              {currentBadge.title}
            </span>
          </div>
        </div>

        {/* Price Drop & Wishlist Alerts Notification Banner */}
        {activeTab === 'feed' && priceDropAlerts.length > 0 && (
          <div style={{ background: '#e8f5e9', borderLeft: '4px solid #27ae60', padding: '12px 16px', borderRadius: '4px', marginBottom: '20px' }}>
            <div style={{ fontWeight: 'bold', color: '#2e7d32', marginBottom: '4px' }}>🔔 Price Drop & Wishlist Alert Notification!</div>
            {priceDropAlerts.map(item => (
              <div key={item.id} style={{ fontSize: '0.85rem', color: '#333', marginTop: '2px' }}>
                • <strong>{item.title}</strong> matching your wishlist alert has dropped to <span style={{ color: '#27ae60', fontWeight: 'bold' }}>₹{item.listPrice}</span>!
              </div>
            ))}
          </div>
        )}

        {/* Global Search Bar Toolbar, Category Pills & Condition Filter */}
        {activeTab === 'feed' && (
          <div style={{ marginBottom: '20px' }}>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="🔍 Search textbooks by title, author, or course code..." 
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', boxSizing: 'border-box', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px' }}
            />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
                  School / Board
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
                  <option value="ALL">Condition: All</option>
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
            <p className="subtitle">Cloud-synced listings with verified photo uploads, in-app live chat, and price drop alerts.</p>
            
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
                        <button className="delete-btn" onClick={() => handleDeleteBook(book.id, book.seller)} title="Remove Listing">
                          &times;
                        </button>
                      )}

                      {/* Display Uploaded Book Photo if available */}
                      {book.photo ? (
                        <div style={{ width: '100%', height: '140px', background: '#f5f5f5', borderRadius: '6px', marginBottom: '10px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <img src={book.photo} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <div style={{ width: '100%', height: '80px', background: '#eef2f7', borderRadius: '6px', marginBottom: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#888', fontSize: '0.8rem' }}>
                          📖 Textbook Photo
                        </div>
                      )}

                      <div className="course-tag">{book.course}</div>
                      <h3>{book.title}</h3>
                      <p className="author">by {book.author}</p>
                      
                      <div className="pricing">
                        <span className="original-price">₹{book.originalPrice}</span>
                        <span className="list-price">₹{book.listPrice}</span>
                        <span className="discount-tag">{discountPercent}% OFF</span>
                      </div>

                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', background: affordability.color, color: 'white', fontWeight: 'bold', display: 'inline-block' }}>
                          {affordability.label}
                        </span>
                      </div>

                      <p className="condition">Condition: <strong>{book.condition}</strong></p>
                      <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '5px' }}>📍 Pickup: <strong>{book.location || 'Main Library'}</strong></p>
                      <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px' }}>Seller: {book.seller}</p>
                      
                      <button className="contact-btn" onClick={() => setChatBook(book)}>
                        In-App Live Chat 💬
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* IN-APP CHAT MODAL */}
        {chatBook && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '450px', maxWidth: '90%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#1a237e', fontSize: '1.1rem' }}>💬 In-App Chat: {chatBook.title}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>Seller: {chatBook.seller} | Location: {chatBook.location}</span>
                </div>
                <button onClick={() => setChatBook(null)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
              </div>

              {/* Chat Message History Box */}
              <div style={{ flex: 1, overflowY: 'auto', background: '#f9f9f9', padding: '12px', borderRadius: '6px', marginBottom: '15px', minHeight: '220px', maxHeight: '300px' }}>
                {chatMessages.map((msg, idx) => {
                  const isMe = msg.sender === currentUserEmail;
                  return (
                    <div key={msg.id || idx} style={{ marginBottom: '10px', textAlign: isMe ? 'right' : 'left' }}>
                      <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '2px' }}>{msg.sender}</div>
                      <div style={{ display: 'inline-block', background: isMe ? '#3f51b5' : '#e0e0e0', color: isMe ? '#fff' : '#333', padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', maxWidth: '80%', wordBreak: 'break-word', textAlign: 'left' }}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Form */}
              <form onSubmit={handleSendChatMessage} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={newMessageText} 
                  onChange={(e) => setNewMessageText(e.target.value)} 
                  placeholder="Type your chat message or meetup offer..." 
                  style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem' }}
                  required
                />
                <button type="submit" style={{ background: '#3f51b5', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Send
                </button>
              </form>
            </div>
          </div>
        )}

        {/* DONATIONS / FREE GIVEAWAY PAGE */}
        {activeTab === 'donations' && (
          <div className="feed-section">
            <h2>🎁 Free Book Donations & Giveaways</h2>
            <p className="subtitle">Students giving away old textbooks and notes 100% free of charge to juniors in need. (Listings set to ₹0 automatically appear here!)</p>

            {donSuccessMsg && <div className="alert success">{donSuccessMsg}</div>}

            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ marginTop: 0, color: '#1a237e' }}>📦 Donate a Book / Notes for Free</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!donTitle || !donCourse) { alert('Please fill required fields'); return; }
                const newDon = { id: Date.now().toString(), title: donTitle, author: donAuthor || 'Various', course: donCourse.toUpperCase(), condition: donCondition, donor: currentUserEmail, location: donLocation || 'Library', photo: '' };
                setDonations([newDon, ...donations]);
                setDonSuccessMsg('Book donation listed successfully! Thank you for supporting peer education.');
                setDonTitle(''); setDonAuthor(''); setDonCourse(''); setDonLocation('');
              }} className="book-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Book / Notes Title</label>
                    <input type="text" value={donTitle} onChange={(e) => setDonTitle(e.target.value)} placeholder="e.g. Physics handwritten notes" required />
                  </div>
                  <div className="form-group">
                    <label>Course Code</label>
                    <input type="text" value={donCourse} onChange={(e) => setDonCourse(e.target.value)} placeholder="e.g. BTECH-PHY101" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Author / Creator</label>
                    <input type="text" value={donAuthor} onChange={(e) => setDonAuthor(e.target.value)} placeholder="e.g. Senior Batch" />
                  </div>
                  <div className="form-group">
                    <label>Pickup Location</label>
                    <input type="text" value={donLocation} onChange={(e) => setDonLocation(e.target.value)} placeholder="Hostel 2 / Main Library" required />
                  </div>
                </div>
                <button type="submit" className="submit-btn" style={{ background: '#27ae60' }}>List Free Donation 🎁</button>
              </form>
            </div>

            <h3>Available Free Giveaways:</h3>
            <div className="book-grid" style={{ marginTop: '15px' }}>
              {donations.map((item) => {
                const isOwner = item.donor && item.donor.toLowerCase() === currentUserEmail.toLowerCase();
                const canDeleteDon = isOwner || isAdmin;

                return (
                  <div key={item.id} className="book-card" style={{ borderTop: '4px solid #27ae60', position: 'relative' }}>
                    {canDeleteDon && (
                      <button className="delete-btn" onClick={() => handleDeleteDonation(item.id, item.donor)} title="Remove Giveaway">
                        &times;
                      </button>
                    )}
                    {item.photo && (
                      <div style={{ width: '100%', height: '120px', background: '#f5f5f5', borderRadius: '6px', marginBottom: '10px', overflow: 'hidden' }}>
                        <img src={item.photo} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <span style={{ background: '#27ae60', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>🎁 FREE GIVEAWAY</span>
                    <div className="course-tag" style={{ marginTop: '8px' }}>{item.course}</div>
                    <h3>{item.title}</h3>
                    <p className="author">by {item.author}</p>
                    <p className="condition">Condition: <strong>{item.condition}</strong></p>
                    <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '5px' }}>📍 Pickup: <strong>{item.location}</strong></p>
                    <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px' }}>Donor: {item.donor}</p>
                    <button className="contact-btn" style={{ background: '#27ae60' }} onClick={() => alert(`Contact donor at ${item.donor} to claim this free donation!`)}>
                      Claim Free Book 🤝
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'sell' && (
          <div className="form-section">
            <h2>List Your Unused Textbook</h2>
            <p className="subtitle">Tip: Setting your listing price to <strong>₹0</strong> will automatically shift your book into Free Donations! 🎁</p>
            
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
                  <label>Your Listing Price (₹ - Enter 0 for Free Giveaway)</label>
                  <input type="number" value={formListPrice} onChange={(e) => setFormListPrice(e.target.value)} placeholder="0 or Max 50% of MRP" required />
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
                <label>Campus Pickup Address / Location</label>
                <input 
                  type="text" 
                  value={formLocation} 
                  onChange={(e) => setFormLocation(e.target.value)} 
                  placeholder="e.g. Main Campus Library, Gate No. 2..." 
                  required 
                />
              </div>
              
              {/* Enhanced Verified Photo Upload Section */}
              <div className="form-group">
                <label>Upload Book Photo from Device (Verified Preview)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoFileChange} 
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '6px', width: '100%', boxSizing: 'border-box', background: '#fff' }} 
                />
                
                {/* Image Verification & Live Preview Box */}
                {imagePreviewUrl && (
                  <div style={{ marginTop: '12px', padding: '10px', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#27ae60', fontWeight: 'bold' }}>✓ Image Verified & Ready for Upload</span>
                      <button 
                        type="button" 
                        onClick={() => { setFormPhotoFile(null); setImagePreviewUrl(''); }}
                        style={{ background: 'none', border: 'none', color: '#e74c3c', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Remove Image
                      </button>
                    </div>
                    <div style={{ width: '100px', height: '100px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #ccc', background: '#fff' }}>
                      <img src={imagePreviewUrl} alt="Verified Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Institutional Email</label>
                <input 
                  type="email" 
                  value={formSeller} 
                  onChange={(e) => setFormSeller(e.target.value)} 
                  placeholder="student@college.ac.in" 
                  required 
                />
              </div>

              <button type="submit" className="submit-btn" disabled={uploadingImage}>
                {uploadingImage ? 'Uploading Image to Cloud... ⏳' : 'Publish Listing (₹0 Shifts to Free Giveaways 🎁)'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="form-section">
            <h2>Wishlist & Price Drop Alert Notifications</h2>
            <p className="subtitle">Add course alerts to receive instant notifications when books are listed or prices drop.</p>

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
              <button type="submit" className="submit-btn">Enable Wishlist & Price Drop Alerts 🔔</button>
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
            <h2>My User Profile & Badge Status</h2>
            <p className="subtitle">Account overview for <strong>{currentUserEmail}</strong></p>

            <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', marginBottom: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', color: '#1a237e' }}>🏆 Earned Contributor Badge</h3>
                <p style={{ margin: 0, color: '#555', fontSize: '0.9rem' }}>Based on your active cloud textbook listings and community sharing activity.</p>
              </div>
              <div style={{ padding: '10px 20px', borderRadius: '8px', background: currentBadge.color, color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>
                {currentBadge.title}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#3f51b5' }}>📦 Active Listings</h3>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0', color: '#333' }}>{userBookCount}</p>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#3f51b5' }}>🎯 Wishlist Alerts</h3>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0', color: '#333' }}>{preferences.length}</p>
              </div>
            </div>

            <h3>Your Shared Book Listings:</h3>
            <div className="book-grid" style={{ marginTop: '15px' }}>
              {books.filter(b => b.seller && b.seller.toLowerCase() === currentUserEmail.toLowerCase()).length === 0 ? (
                <p style={{ color: '#777' }}>You have not listed any textbooks yet. Head over to "Sell Book" to share one!</p>
              ) : (
                books.filter(b => b.seller && b.seller.toLowerCase() === currentUserEmail.toLowerCase()).map(book => (
                  <div key={book.id} className="book-card" style={{ position: 'relative' }}>
                    <button className="delete-btn" onClick={() => handleDeleteBook(book.id, book.seller)} title="Remove Listing">
                      &times;
                    </button>
                    {book.photo && (
                      <div style={{ width: '100%', height: '120px', background: '#f5f5f5', borderRadius: '6px', marginBottom: '10px', overflow: 'hidden' }}>
                        <img src={book.photo} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
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

            <h3 style={{ marginTop: '30px' }}>Your Free Book Giveaways:</h3>
            <div className="book-grid" style={{ marginTop: '15px' }}>
              {donations.filter(d => d.donor && d.donor.toLowerCase() === currentUserEmail.toLowerCase()).length === 0 ? (
                <p style={{ color: '#777' }}>You have not listed any free giveaways yet.</p>
              ) : (
                donations.filter(d => d.donor && d.donor.toLowerCase() === currentUserEmail.toLowerCase()).map(item => (
                  <div key={item.id} className="book-card" style={{ borderTop: '4px solid #27ae60', position: 'relative' }}>
                    <button className="delete-btn" onClick={() => handleDeleteDonation(item.id, item.donor)} title="Remove Giveaway">
                      &times;
                    </button>
                    {item.photo && (
                      <div style={{ width: '100%', height: '120px', background: '#f5f5f5', borderRadius: '6px', marginBottom: '10px', overflow: 'hidden' }}>
                        <img src={item.photo} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <span style={{ background: '#27ae60', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>🎁 FREE GIVEAWAY</span>
                    <div className="course-tag" style={{ marginTop: '8px' }}>{item.course}</div>
                    <h3>{item.title}</h3>
                    <p className="author">by {item.author}</p>
                    <p className="condition">Condition: <strong>{item.condition}</strong></p>
                    <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '5px' }}>📍 Pickup: <strong>{item.location}</strong></p>
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
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', borderLeft: '4px solid #3f51b5' }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#555', fontSize: '0.9rem' }}>Total Books Listed</h4>
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
                      <th style={{ padding: '10px' }}>Seller Email</th>
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
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Free Giveaways Table for Admins */}
            <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginTop: '30px' }}>
              <h3 style={{ marginTop: 0, color: '#27ae60' }}>🎁 Active Free Book Giveaways ({donations.length})</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '15px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd', color: '#555' }}>
                    <th style={{ padding: '10px' }}>Course Code</th>
                    <th style={{ padding: '10px' }}>Title</th>
                    <th style={{ padding: '10px' }}>Donor Email</th>
                    <th style={{ padding: '10px' }}>Pickup Location</th>
                    <th style={{ padding: '10px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '15px', textAlign: 'center', color: '#777' }}>No active free giveaways.</td>
                    </tr>
                  ) : (
                    donations.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.course}</td>
                        <td style={{ padding: '10px' }}>{item.title}</td>
                        <td style={{ padding: '10px', color: '#666' }}>{item.donor}</td>
                        <td style={{ padding: '10px' }}>{item.location}</td>
                        <td style={{ padding: '10px' }}>
                          <button 
                            onClick={() => handleDeleteDonation(item.id, item.donor)} 
                            style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;