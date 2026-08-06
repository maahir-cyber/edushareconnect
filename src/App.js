import React, { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
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
  const [donations, setDonations] = useState([]);
  const [teachersNotes, setTeachersNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedConditionFilter, setSelectedConditionFilter] = useState('ALL');

  // In-App Chat Modal State & Meetup Scheduler State
  const [chatBook, setChatBook] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [meetupLocation, setMeetupLocation] = useState('Central Library');
  const [meetupTime, setMeetupTime] = useState('');
  const [meetupSuccessMsg, setMeetupSuccessMsg] = useState('');

  // Donation Form State
  const [donTitle, setDonTitle] = useState('');
  const [donAuthor, setDonAuthor] = useState('');
  const [donCourse, setDonCourse] = useState('');
  const [donCondition] = useState('Good');
  const [donLocation, setDonLocation] = useState('');
  const [donIsDigital, setDonIsDigital] = useState(false);
  const [donPdfLink, setDonPdfLink] = useState('');
  const [donSuccessMsg, setDonSuccessMsg] = useState('');

  // Teacher Notes & Syllabus Upload Form State
  const [tnTitle, setTnTitle] = useState('');
  const [tnSubject, setTnSubject] = useState('');
  const [tnCourse, setTnCourse] = useState('');
  const [tnType, setTnType] = useState('Lecture Notes');
  const [tnPdfLink, setTnPdfLink] = useState('');
  const [tnSuccessMsg, setTnSuccessMsg] = useState('');

  // User Ratings & Peer Trust Score State
  const [userRatings, setUserRatings] = useState(() => {
    const savedRatings = localStorage.getItem('edushare_user_ratings');
    return savedRatings ? JSON.parse(savedRatings) : {
      'admin@edushare.ac.in': { totalStars: 25, count: 5 }
    };
  });

  useEffect(() => {
    localStorage.setItem('edushare_user_ratings', JSON.stringify(userRatings));
  }, [userRatings]);

  const [ratingTargetUser, setRatingTargetUser] = useState('');
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingReviewText, setRatingReviewText] = useState('');
  const [ratingSuccessMsg, setRatingSuccessMsg] = useState('');

  // Check if current user is admin or designated teacher
  const isAdmin = currentUserEmail.trim().toLowerCase() === 'admin@edushare.ac.in';
  const isTeacher = currentUserEmail.trim().toLowerCase().includes('teacher') || currentUserEmail.trim().toLowerCase() === 'edushare.connect.1@gmail.com' || isAdmin;

  // Fetch books, donations, AND teachers notes from Firebase Cloud Firestore on login
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchCloudData = async () => {
      setLoading(true);
      try {
        // Fetch Books
        const booksSnapshot = await getDocs(collection(db, "books"));
        const booksList = booksSnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        
        if (booksList.length > 0) {
          setBooks(booksList);
        } else {
          setBooks([
            { id: '1', title: 'NCERT Mathematics Class 12', author: 'NCERT', course: 'CLASS12-MATH', originalPrice: 150, listPrice: 70, condition: 'Like New', seller: 'rahul@gmail.com', location: 'Main Library' },
            { id: '2', title: 'Concepts of Physics Vol 1', author: 'H.C. Verma', course: 'BTECH-PHY101', originalPrice: 450, listPrice: 200, condition: 'Good', seller: 'priya@gmail.com', location: 'Campus Gate 1' }
          ]);
        }

        // Fetch Donations from Firestore Cloud
        const donationsSnapshot = await getDocs(collection(db, "donations"));
        const donationsList = donationsSnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));

        if (donationsList.length > 0) {
          setDonations(donationsList);
        } else {
          setDonations([
            { id: 'd1', title: 'Old Chemistry Lab Manual & Notes', author: 'Department of Chemistry', course: 'BTECH-CHEM', condition: 'Good', donor: 'arjun@gmail.com', location: 'Science Block', isDigital: false },
            { id: 'd2', title: 'Class 10 Foundation Mathematics Formula Sheet', author: 'R.D. Sharma', course: 'CLASS10-MATH', condition: 'Digital PDF', donor: 'sneha@gmail.com', location: 'Online Drive', isDigital: true, pdfLink: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
          ]);
        }

        // Fetch Teachers Notes & Syllabuses from Firestore Cloud
        const teacherNotesSnapshot = await getDocs(collection(db, "teachersNotes"));
        const teacherNotesList = teacherNotesSnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));

        if (teacherNotesList.length > 0) {
          setTeachersNotes(teacherNotesList);
        } else {
          setTeachersNotes([
            { id: 'tn1', title: 'Complete Semester Syllabus & Marking Scheme', subject: 'Mathematics', course: 'BTECH-MATH101', type: 'Syllabus', uploader: 'EduShare.Connect.1@gmail.com', pdfLink: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
            { id: 'tn2', title: 'Unit 1 & 2 Lecture Notes - Quantum Physics', subject: 'Physics', course: 'BTECH-PHY101', type: 'Lecture Notes', uploader: 'EduShare.Connect.1@gmail.com', pdfLink: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
          ]);
        }

      } catch (error) {
        console.error("Error fetching cloud data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCloudData();
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
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-sync form seller email when logged in
  useEffect(() => {
    if (currentUserEmail) {
      setFormSeller(currentUserEmail);
    }
  }, [currentUserEmail]);

  // Handle Secure Authentication with @gmail.com Check
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const emailInput = loginEmail.trim().toLowerCase();

    // Prevent login using the helpline contact email since it is display/contact only
    if (emailInput === 'edushare.connect.1@gmail.com') {
      alert("Notice: 'EduShare.Connect.1@gmail.com' is designated strictly as our official Support & Helpline contact email and cannot be used to log in as a user account. Please sign in with your personal student or admin account.");
      return;
    }

    // Enforce @gmail.com check unless logging in as admin
    if (emailInput !== 'admin@edushare.ac.in') {
      const isValidGmail = emailInput.endsWith('@gmail.com');
      if (!isValidGmail) {
        alert("Email Restriction Error: Registration & login require a valid '@gmail.com' address.");
        return;
      }
    }

    try {
      if (isSignUpMode) {
        await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
        alert("Account created successfully! You are now logged in.");
      } else {
        await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      }
      setCurrentUserEmail(emailInput);
      setFormSeller(emailInput);
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

  // Handle listing submission to Firebase Cloud (Shifts ₹0 or free listings directly to Donations)
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
      setErrorMsg('Please provide a valid email address.');
      return;
    }

    // If listing price is 0, shift it automatically to Firebase Cloud Donations
    if (listed === 0) {
      const newDonationItem = {
        title: formTitle,
        author: formAuthor,
        course: formCourse.toUpperCase(),
        condition: formCondition,
        donor: sellerEmail,
        location: formLocation || 'Main Campus Library',
        isDigital: false,
        createdAt: serverTimestamp()
      };

      try {
        const docRef = await addDoc(collection(db, "donations"), newDonationItem);
        setDonations([{ id: docRef.id, ...newDonationItem }, ...donations]);
        setSuccessMsg('🎉 Listing price was ₹0! Automatically synced your book to Free Book Cloud Donations & Giveaways.');
      } catch (err) {
        console.error("Error adding donation to cloud:", err);
        setErrorMsg('Failed to sync donation to cloud database.');
      }
      
      setFormTitle('');
      setFormAuthor('');
      setFormCourse('');
      setFormOriginalPrice('');
      setFormListPrice('');
      setFormLocation('');
      setFormSeller(currentUserEmail);
      return;
    }

    const maxAllowedPrice = orig * 0.5;

    if (listed > maxAllowedPrice) {
      setErrorMsg(`Policy Error: Max allowed price for a ₹${orig} book is ₹${maxAllowedPrice.toFixed(2)} (Minimum 50% discount required). Note: Setting the price to ₹0 automatically shifts it to Free Donations.`);
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
      setSuccessMsg('Book listed live on the cloud successfully with wishlist notifications active!');
      
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

  // Handle publishing a new donation to Firebase Cloud
  const handlePublishDonation = async (e) => {
    e.preventDefault();
    if (!donTitle || !donCourse) { alert('Please fill in required fields'); return; }

    const newDonationData = { 
      title: donTitle, 
      author: donAuthor || 'Various', 
      course: donCourse.toUpperCase(), 
      condition: donIsDigital ? 'Digital PDF' : donCondition, 
      donor: currentUserEmail, 
      location: donIsDigital ? 'Online Drive' : (donLocation || 'Library'),
      isDigital: donIsDigital,
      pdfLink: donIsDigital ? (donPdfLink || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf') : '',
      createdAt: serverTimestamp()
    };

    try {
      const docRef = await addDoc(collection(db, "donations"), newDonationData);
      setDonations([{ id: docRef.id, ...newDonationData }, ...donations]);
      setDonSuccessMsg('Donation/Digital resource published & synced live to cloud successfully!');
      setDonTitle(''); setDonAuthor(''); setDonCourse(''); setDonLocation(''); setDonPdfLink('');
    } catch (err) {
      console.error("Error saving donation: ", err);
      alert("Failed to save donation to cloud database.");
    }
  };

  // Handle uploading Teacher Notes & Syllabuses to Firebase Cloud
  const handleUploadTeacherNotes = async (e) => {
    e.preventDefault();
    if (!isTeacher) {
      alert("Unauthorized: Only teachers and helpline staff can upload verified lecture notes and syllabuses!");
      return;
    }
    if (!tnTitle || !tnCourse || !tnSubject) {
      alert("Please fill in all required teacher notes fields.");
      return;
    }

    const newNoteData = {
      title: tnTitle,
      subject: tnSubject,
      course: tnCourse.toUpperCase(),
      type: tnType,
      uploader: currentUserEmail,
      pdfLink: tnPdfLink || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      createdAt: serverTimestamp()
    };

    try {
      const docRef = await addDoc(collection(db, "teachersNotes"), newNoteData);
      setTeachersNotes([{ id: docRef.id, ...newNoteData }, ...teachersNotes]);
      setTnSuccessMsg('👨‍🏫 Teacher notes & syllabus uploaded and synced live to cloud successfully!');
      setTnTitle(''); setTnSubject(''); setTnCourse(''); setTnPdfLink('');
    } catch (err) {
      console.error("Error uploading teacher note: ", err);
      alert("Failed to upload teacher notes to cloud database.");
    }
  };

  // Handle deleting a teacher note (teacher or admin)
  const handleDeleteTeacherNote = async (noteId, uploaderEmail) => {
    const isOwner = uploaderEmail && uploaderEmail.toLowerCase() === currentUserEmail.toLowerCase();
    if (!isOwner && !isAdmin) {
      alert("Unauthorized: You can only remove teacher notes you uploaded unless you are admin.");
      return;
    }

    if (window.confirm("Are you sure you want to remove this teacher note/syllabus?")) {
      try {
        if (noteId.length > 5) {
          await deleteDoc(doc(db, "teachersNotes", noteId));
        }
        setTeachersNotes(teachersNotes.filter(n => n.id !== noteId));
      } catch (err) {
        console.error("Error deleting teacher note:", err);
        alert("Failed to delete note from cloud database.");
      }
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

  // Handle deleting a free book donation / giveaway from Cloud Firestore
  const handleDeleteDonation = async (donId, donorEmail) => {
    const isOwner = donorEmail && donorEmail.toLowerCase() === currentUserEmail.toLowerCase();
    
    if (!isOwner && !isAdmin) {
      alert("Unauthorized: You can only delete your own free giveaways unless you are the admin!");
      return;
    }

    if (window.confirm("Are you sure you want to remove this free giveaway?")) {
      try {
        if (donId.length > 5) {
          await deleteDoc(doc(db, "donations", donId));
        }
        setDonations(donations.filter(item => item.id !== donId));
      } catch (error) {
        console.error("Error deleting donation: ", error);
        alert("Failed to delete donation from cloud database.");
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
      setWishlistSuccessMsg('Wishlist alert & price drop notifications registered successfully!');
      setWishlistCourse('');
      setWishlistSubject('');
      setWishlistMaxPrice('');
    } else {
      setWishlistErrorMsg('This alert preference already exists.');
    }
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
      setChatMessages([...chatMessages, { id: Date.now().toString(), sender: currentUserEmail, text: newMessageText }]);
      setNewMessageText('');
    }
  };

  // Handle Meetup Scheduler Submission
  const handleScheduleMeetup = (e) => {
    e.preventDefault();
    if (!meetupTime) {
      alert('Please select a valid time slot for your campus meetup.');
      return;
    }
    setMeetupSuccessMsg(`🤝 Campus meetup scheduled successfully at "${meetupLocation}" for ${meetupTime}!`);
    setTimeout(() => setMeetupSuccessMsg(''), 5000);
  };

  // Handle User Rating Submission
  const handleRatingSubmit = (e) => {
    e.preventDefault();
    setRatingSuccessMsg('');
    const targetEmail = ratingTargetUser.trim().toLowerCase();

    if (!targetEmail) {
      alert('Please enter a valid peer email address to rate.');
      return;
    }

    const existingData = userRatings[targetEmail] || { totalStars: 0, count: 0 };
    const updatedStars = existingData.totalStars + Number(ratingStars);
    const updatedCount = existingData.count + 1;

    setUserRatings({
      ...userRatings,
      [targetEmail]: { totalStars: updatedStars, count: updatedCount }
    });

    setRatingSuccessMsg(`⭐ Successfully submitted ${ratingStars}-star rating and review for ${targetEmail}! Peer trust score updated.`);
    setRatingTargetUser('');
    setRatingReviewText('');
  };

  // Calculate peer trust average score for any email
  const getPeerRating = (email) => {
    if (!email) return 'New (5.0 ⭐)';
    if (email.toLowerCase() === 'edushare.connect.1@gmail.com') return 'Official Helpline (5.0 ⭐)';
    const data = userRatings[email.toLowerCase()];
    if (!data || data.count === 0) return 'Student (5.0 ⭐)';
    const avg = (data.totalStars / data.count).toFixed(1);
    return `${avg} ⭐ (${data.count} ratings)`;
  };

  // Calculate Badge System
  const userBookCount = books.filter(b => b.seller && b.seller.toLowerCase() === currentUserEmail.toLowerCase()).length;
  const userDonationCount = donations.filter(d => d.donor && d.donor.toLowerCase() === currentUserEmail.toLowerCase()).length;
  const totalUserContributions = userBookCount + userDonationCount;

  const getUserBadge = () => {
    if (currentUserEmail.toLowerCase() === 'edushare.connect.1@gmail.com') return { title: '☎️ Official Support Helpline', color: '#d35400' };
    if (totalUserContributions >= 5) return { title: '🌟 Elite Campus Donor & Seller', color: '#8e44ad' };
    if (totalUserContributions >= 2) return { title: '⭐ Active Contributor', color: '#2980b9' };
    if (totalUserContributions === 1) return { title: '🌱 Starter Seller', color: '#27ae60' };
    return { title: '📚 Verified Academic Explorer', color: '#27ae60' };
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
            <div className="hero-badge">✨ Campus Network & Helpline Support</div>
            <h1 className="hero-title">EDUSHARE CONNECT</h1>
            
            <div className="scroll-content-box">
              <div className="vision-mission-block">
                <h3>🛡️ SECURE GMAIL ACCESS & HELPLINE</h3>
                <p>Platform secure access utilizes verified <strong>@gmail.com</strong> accounts. Need assistance? Contact our official helpline at <strong>EduShare.Connect.1@gmail.com</strong> (contact & support only; login disabled for this helpline address).</p>
              </div>

              <div className="vision-mission-block">
                <h3>👨‍🏫 TEACHERS & SYLLABUS HUB</h3>
                <p>Access official lecture notes, curriculum guides, and syllabuses uploaded directly by faculty members.</p>
              </div>

              <div className="vision-mission-block">
                <h3>📂 DIGITAL RESOURCE HUB</h3>
                <p>Share and download class notes, formula sheets, and study guide PDFs instantly alongside physical textbook exchanges.</p>
              </div>
            </div>
            
            {/* IN MOBILE VIEW: RENDER LOGIN CARD RIGHT UNDER THE VISION / HERO CONTENT BOX */}
            {deviceMode === 'mobile' && (
              <div className="login-card" style={{ marginTop: '20px', width: '100%', boxSizing: 'border-box' }}>
                <h2>{isSignUpMode ? '📝 Gmail Account Sign-Up' : '🔐 Gmail Portal Sign-In'}</h2>
                <p className="subtitle">{isSignUpMode ? 'Use your @gmail.com address' : 'Enter your @gmail.com account.'}</p>
                
                <form onSubmit={handleAuthSubmit} className="book-form">
                  <div className="form-group">
                    <label>Gmail Address (@gmail.com)</label>
                    <input 
                      type="email" 
                      value={loginEmail} 
                      onChange={(e) => setLoginEmail(e.target.value)} 
                      placeholder="student@gmail.com" 
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
                  <button type="submit" className="submit-btn" style={{ background: '#27ae60' }}>
                    {isSignUpMode ? 'Register Gmail Account 🚀' : 'Login Securely 🚀'}
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
              <h2>{isSignUpMode ? '📝 Gmail Account Sign-Up' : '🔐 Gmail Portal Sign-In'}</h2>
              <p className="subtitle">{isSignUpMode ? 'Use your @gmail.com address' : 'Enter your @gmail.com account.'}</p>
              
              <form onSubmit={handleAuthSubmit} className="book-form">
                <div className="form-group">
                  <label>Gmail Address (@gmail.com)</label>
                  <input 
                    type="email" 
                    value={loginEmail} 
                    onChange={(e) => setLoginEmail(e.target.value)} 
                    placeholder="student@gmail.com" 
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
                <button type="submit" className="submit-btn" style={{ background: '#27ae60' }}>
                  {isSignUpMode ? 'Register Gmail Account 🚀' : 'Login Securely 🚀'}
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
          <button className={activeTab === 'donations' ? 'active' : ''} onClick={() => setItemsTab('donations')}>Donations & PDFs 🎁</button>
          <button className={activeTab === 'teachers' ? 'active' : ''} onClick={() => setItemsTab('teachers')} style={{ background: '#2980b9', color: 'white' }}>
            Teachers Notes & Syllabuses 👨‍🏫
          </button>
          <button className={activeTab === 'preferences' ? 'active' : ''} onClick={() => setItemsTab('preferences')}>
            Wishlist {wishlistMatchCount > 0 && <span style={{ background: '#e74c3c', color: 'white', padding: '1px 6px', borderRadius: '10px', fontSize: '0.75rem', marginLeft: '5px' }}>{wishlistMatchCount}</span>}
          </button>
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
            User: <strong>{currentUserEmail}</strong> {isAdmin && <span style={{ color: '#d35400', fontWeight: 'bold' }}>(Admin)</span>} | Helpline Contact: <a href="mailto:EduShare.Connect.1@gmail.com" style={{ color: '#3f51b5', fontWeight: 'bold' }}>EduShare.Connect.1@gmail.com</a>
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
            <h2>Academic Book Marketplace</h2>
            <p className="subtitle">Cloud-synced listings with verified peer ratings and in-app live chat.</p>
            
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
                  const sellerRating = getPeerRating(book.seller);

                  return (
                    <div key={book.id} className={`book-card ${isMatched ? 'matched-card' : ''}`}>
                      {isMatched && <span className="match-badge">🎯 Wishlist Match!</span>}
                      
                      {canDelete && (
                        <button className="delete-btn" onClick={() => handleDeleteBook(book.id, book.seller)} title="Remove Listing">
                          &times;
                        </button>
                      )}

                      <div style={{ width: '100%', height: '80px', background: '#eef2f7', borderRadius: '6px', marginBottom: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#888', fontSize: '0.8rem' }}>
                        📖 Textbook Listing
                      </div>

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
                      <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '3px' }}>📍 Pickup: <strong>{book.location || 'Main Library'}</strong></p>
                      <p style={{ fontSize: '0.8rem', color: '#27ae60', marginBottom: '5px' }}>👤 Seller: {book.seller} ({sellerRating})</p>
                      
                      <button className="contact-btn" onClick={() => setChatBook(book)}>
                        In-App Chat & Meetup 💬
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* IN-APP CHAT & MEETUP SCHEDULER MODAL */}
        {chatBook && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '480px', maxWidth: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.25)', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#1a237e', fontSize: '1.1rem' }}>💬 Chat & Meetup: {chatBook.title}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>Seller: {chatBook.seller} | Location: {chatBook.location}</span>
                </div>
                <button onClick={() => setChatBook(null)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
              </div>

              {/* Meetup Scheduler Section */}
              <div style={{ background: '#e8f5e9', padding: '12px', borderRadius: '6px', marginBottom: '15px', borderLeft: '4px solid #27ae60' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#2e7d32', fontSize: '0.9rem' }}>📅 Schedule Campus Meetup</h4>
                {meetupSuccessMsg && <div style={{ fontSize: '0.8rem', color: '#2e7d32', marginBottom: '8px', fontWeight: 'bold' }}>{meetupSuccessMsg}</div>}
                <form onSubmit={handleScheduleMeetup} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px' }}>
                  <select value={meetupLocation} onChange={(e) => setMeetupLocation(e.target.value)} style={{ padding: '6px', fontSize: '0.8rem', borderRadius: '4px' }}>
                    <option value="Central Library">Central Library</option>
                    <option value="Main Canteen">Main Canteen</option>
                    <option value="Science Block Gate">Science Block Gate</option>
                    <option value="Student Activity Center">Student Activity Center</option>
                  </select>
                  <input type="datetime-local" value={meetupTime} onChange={(e) => setMeetupTime(e.target.value)} style={{ padding: '6px', fontSize: '0.8rem', borderRadius: '4px' }} required />
                  <button type="submit" style={{ background: '#27ae60', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>Propose</button>
                </form>
              </div>

              {/* Chat Message History Box */}
              <div style={{ flex: 1, overflowY: 'auto', background: '#f9f9f9', padding: '12px', borderRadius: '6px', marginBottom: '15px', minHeight: '180px', maxHeight: '220px' }}>
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
                  placeholder="Type your message..." 
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

        {/* TEACHERS NOTES & SYLLABUSES HUB */}
        {activeTab === 'teachers' && (
          <div className="feed-section">
            <h2>👨‍🏫 Teachers Notes & Syllabuses Hub</h2>
            <p className="subtitle">Official curriculum syllabuses and chapter lecture notes uploaded directly by faculty and verified instructors.</p>

            {tnSuccessMsg && <div className="alert success">{tnSuccessMsg}</div>}

            {/* Upload form visible to teachers / admin */}
            {isTeacher ? (
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #2980b9' }}>
                <h3 style={{ marginTop: 0, color: '#1a237e' }}>📤 Upload Teacher Notes or Syllabus PDF</h3>
                <form onSubmit={handleUploadTeacherNotes} className="book-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Title / Topic Name</label>
                      <input type="text" value={tnTitle} onChange={(e) => setTnTitle(e.target.value)} placeholder="e.g. Unit 3 Lecture Notes - Calculus" required />
                    </div>
                    <div className="form-group">
                      <label>Course / Subject Code</label>
                      <input type="text" value={tnCourse} onChange={(e) => setTnCourse(e.target.value)} placeholder="e.g. BTECH-MATH101" required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Subject Name</label>
                      <input type="text" value={tnSubject} onChange={(e) => setTnSubject(e.target.value)} placeholder="e.g. Mathematics" required />
                    </div>
                    <div className="form-group">
                      <label>Resource Category</label>
                      <select value={tnType} onChange={(e) => setTnType(e.target.value)}>
                        <option value="Lecture Notes">Lecture Notes</option>
                        <option value="Syllabus">Syllabus & Marking Scheme</option>
                        <option value="Assignment">Assignment Guidelines</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>PDF / Drive Link URL</label>
                    <input type="url" value={tnPdfLink} onChange={(e) => setTnPdfLink(e.target.value)} placeholder="https://drive.google.com/... or sample PDF link" />
                  </div>
                  <button type="submit" className="submit-btn" style={{ background: '#2980b9' }}>Publish Teacher Resource 👨‍🏫</button>
                </form>
              </div>
            ) : (
              <div style={{ background: '#eef2f7', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontSize: '0.9rem', color: '#555' }}>
                💡 Note: Faculty upload access is enabled for teachers and admin accounts. For any assistance, reach out via our helpline contact at <strong style={{ color: '#3f51b5' }}>EduShare.Connect.1@gmail.com</strong>.
              </div>
            )}

            <h3>Available Faculty Notes & Syllabuses:</h3>
            <div className="book-grid" style={{ marginTop: '15px' }}>
              {teachersNotes.map((note) => {
                const isOwner = note.uploader && note.uploader.toLowerCase() === currentUserEmail.toLowerCase();
                const canDeleteNote = isOwner || isAdmin;

                return (
                  <div key={note.id} className="book-card" style={{ borderTop: '4px solid #2980b9', position: 'relative' }}>
                    {canDeleteNote && (
                      <button className="delete-btn" onClick={() => handleDeleteTeacherNote(note.id, note.uploader)} title="Remove Note">
                        &times;
                      </button>
                    )}
                    <span style={{ background: '#2980b9', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      👨‍🏫 {note.type.toUpperCase()}
                    </span>
                    <div className="course-tag" style={{ marginTop: '8px' }}>{note.course}</div>
                    <h3>{note.title}</h3>
                    <p className="author">Subject: {note.subject}</p>
                    <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '10px' }}>Uploaded by: <strong>{note.uploader}</strong></p>
                    
                    <a href={note.pdfLink || '#'} target="_blank" rel="noopener noreferrer" className="contact-btn" style={{ background: '#2980b9', display: 'block', textAlign: 'center', textDecoration: 'none', color: 'white' }}>
                      Download Official PDF 📂
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DONATIONS & DIGITAL PDF / NOTES HUB */}
        {activeTab === 'donations' && (
          <div className="feed-section">
            <h2>🎁 Cloud Free Book Donations & Digital Study Notes Hub</h2>
            <p className="subtitle">Share free physical textbooks or upload class notes, formula sheets, and study guide PDFs instantly for peers across devices.</p>

            {donSuccessMsg && <div className="alert success">{donSuccessMsg}</div>}

            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ marginTop: 0, color: '#1a237e' }}>📂 Donate Physical Book or Upload Digital PDF Notes</h3>
              <form onSubmit={handlePublishDonation} className="book-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Title / Notes Name</label>
                    <input type="text" value={donTitle} onChange={(e) => setDonTitle(e.target.value)} placeholder="e.g. Physics Formula Sheet" required />
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
                    <label>Resource Type</label>
                    <select value={donIsDigital ? 'digital' : 'physical'} onChange={(e) => setDonIsDigital(e.target.value === 'digital')}>
                      <option value="physical">Physical Book / Notes</option>
                      <option value="digital">Digital PDF / Notes Share</option>
                    </select>
                  </div>
                </div>

                {donIsDigital ? (
                  <div className="form-group">
                    <label>PDF Drive / Resource Link (URL)</label>
                    <input type="url" value={donPdfLink} onChange={(e) => setDonPdfLink(e.target.value)} placeholder="https://drive.google.com/... or sample PDF link" />
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Pickup Location</label>
                    <input type="text" value={donLocation} onChange={(e) => setDonLocation(e.target.value)} placeholder="Hostel 2 / Main Library" required />
                  </div>
                )}

                <button type="submit" className="submit-btn" style={{ background: '#27ae60' }}>Publish Free Resource 🎁</button>
              </form>
            </div>

            <h3>Available Free Giveaways & Digital Resources:</h3>
            <div className="book-grid" style={{ marginTop: '15px' }}>
              {donations.map((item) => {
                const isOwner = item.donor && item.donor.toLowerCase() === currentUserEmail.toLowerCase();
                const canDeleteDon = isOwner || isAdmin;

                return (
                  <div key={item.id} className="book-card" style={{ borderTop: `4px solid ${item.isDigital ? '#2980b9' : '#27ae60'}`, position: 'relative' }}>
                    {canDeleteDon && (
                      <button className="delete-btn" onClick={() => handleDeleteDonation(item.id, item.donor)} title="Remove Resource">
                        &times;
                      </button>
                    )}
                    <span style={{ background: item.isDigital ? '#2980b9' : '#27ae60', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      {item.isDigital ? '📂 DIGITAL PDF NOTES' : '🎁 FREE GIVEAWAY'}
                    </span>
                    <div className="course-tag" style={{ marginTop: '8px' }}>{item.course}</div>
                    <h3>{item.title}</h3>
                    <p className="author">by {item.author}</p>
                    <p className="condition">Type: <strong>{item.condition}</strong></p>
                    <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '5px' }}>📍 {item.isDigital ? 'Access:' : 'Pickup:'} <strong>{item.location}</strong></p>
                    <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px' }}>Shared by: {item.donor}</p>
                    
                    {item.isDigital ? (
                      <a href={item.pdfLink || '#'} target="_blank" rel="noopener noreferrer" className="contact-btn" style={{ background: '#2980b9', display: 'block', textAlign: 'center', textDecoration: 'none', color: 'white' }}>
                        Download PDF Notes 📂
                      </a>
                    ) : (
                      <button className="contact-btn" style={{ background: '#27ae60' }} onClick={() => alert(`Contact donor at ${item.donor} to claim this free book!`)}>
                        Claim Free Book 🤝
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'sell' && (
          <div className="form-section">
            <h2>List Your Unused Textbook</h2>
            <p className="subtitle">Tip: Setting your listing price to <strong>₹0</strong> will automatically shift your book into Cloud Free Donations! 🎁</p>
            
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

              <div className="form-group">
                <label>Gmail Address</label>
                <input 
                  type="email" 
                  value={formSeller} 
                  onChange={(e) => setFormSeller(e.target.value)} 
                  placeholder="student@gmail.com" 
                  required 
                />
              </div>

              <button type="submit" className="submit-btn" style={{ background: '#27ae60' }}>
                Publish Listing (₹0 Shifts to Free Giveaways 🎁)
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
              <button type="submit" className="submit-btn" style={{ background: '#27ae60' }}>Enable Wishlist & Price Drop Alerts 🔔</button>
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

        {activeTab === 'profile' && (
          <div className="feed-section">
            <h2>My User Profile & Peer Trust Score</h2>
            <p className="subtitle">Account overview for <strong>{currentUserEmail}</strong> (Trust Rating: <strong>{getPeerRating(currentUserEmail)}</strong>)</p>

            {ratingSuccessMsg && <div className="alert success">{ratingSuccessMsg}</div>}

            {/* Helpline Contact Card */}
            <div style={{ background: '#fff3e0', borderLeft: '4px solid #d35400', padding: '15px 20px', borderRadius: '8px', marginBottom: '25px' }}>
              <h3 style={{ margin: '0 0 5px 0', color: '#d35400', fontSize: '1.05rem' }}>☎️ Official Support Helpline</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>
                Need help with your account, textbook listings, or teacher resources? Contact our support team at <a href="mailto:EduShare.Connect.1@gmail.com" style={{ color: '#d35400', fontWeight: 'bold' }}>EduShare.Connect.1@gmail.com</a>. (Note: This email is dedicated strictly for support and inquiries and cannot be used for user login).
              </p>
            </div>

            {/* User Rating Submission Form */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', marginBottom: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #f39c12' }}>
              <h3 style={{ marginTop: 0, color: '#d35400', fontSize: '1.1rem' }}>⭐ Rate a Peer Student</h3>
              <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '15px' }}>Completed an exchange? Rate your peer seller/buyer to boost campus trust scores.</p>
              <form onSubmit={handleRatingSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr auto', gap: '10px', alignItems: 'center' }}>
                <input type="email" value={ratingTargetUser} onChange={(e) => setRatingTargetUser(e.target.value)} placeholder="peer@gmail.com" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.9rem' }} required />
                <select value={ratingStars} onChange={(e) => setRatingStars(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.9rem' }}>
                  <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                  <option value="4">⭐⭐⭐⭐ (4)</option>
                  <option value="3">⭐⭐⭐ (3)</option>
                  <option value="2">⭐⭐ (2)</option>
                  <option value="1">⭐ (1)</option>
                </select>
                <input type="text" value={ratingReviewText} onChange={(e) => setRatingReviewText(e.target.value)} placeholder="Great meetup experience!" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.9rem' }} />
                <button type="submit" style={{ background: '#f39c12', color: 'white', border: 'none', padding: '9px 16px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Rate Peer</button>
              </form>
            </div>

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

            <h3 style={{ marginTop: '30px' }}>Your Free Book Giveaways & Digital Notes:</h3>
            <div className="book-grid" style={{ marginTop: '15px' }}>
              {donations.filter(d => d.donor && d.donor.toLowerCase() === currentUserEmail.toLowerCase()).length === 0 ? (
                <p style={{ color: '#777' }}>You have not listed any free giveaways yet.</p>
              ) : (
                donations.filter(d => d.donor && d.donor.toLowerCase() === currentUserEmail.toLowerCase()).map(item => (
                  <div key={item.id} className="book-card" style={{ borderTop: '4px solid #27ae60', position: 'relative' }}>
                    <button className="delete-btn" onClick={() => handleDeleteDonation(item.id, item.donor)} title="Remove Giveaway">
                      &times;
                    </button>
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
            <p className="subtitle">Overview of platform metrics, textbook transactions, and user statistics.</p>
            
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
          </div>
        )}

      </main>
    </div>
  );
}

export default App;