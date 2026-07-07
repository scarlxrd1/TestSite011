import { db, auth } from './firebase-config.js';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { 
    collection, 
    onSnapshot, 
    doc, 
    updateDoc, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    const adminUserEmail = document.getElementById('admin-user-email');
    const tableBody = document.getElementById('bookings-table-body');

    let unsubscribeSnapshot = null;

    // ==========================================
    // 1. Authentication Guard & Management
    // ==========================================
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Admin is logged in: Show dashboard, hide login
            loginScreen.classList.add('hidden');
            dashboardScreen.classList.remove('hidden');
            if (adminUserEmail) adminUserEmail.textContent = user.email;
            
            // Initialize real-time data fetching
            fetchBookings();
        } else {
            // Admin is logged out: Show login, hide dashboard
            loginScreen.classList.remove('hidden');
            dashboardScreen.classList.add('hidden');
            
            // Clean up Firestore listener to prevent memory leaks/permission errors
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
                unsubscribeSnapshot = null;
            }
        }
    });

    // Handle Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('admin-email').value;
            const password = document.getElementById('admin-password').value;

            try {
                await signInWithEmailAndPassword(auth, email, password);
                loginError.classList.add('hidden');
                loginForm.reset();
            } catch (error) {
                console.error("Login Error:", error);
                loginError.textContent = "Invalid email or password.";
                loginError.classList.remove('hidden');
            }
        });
    }

    // Handle Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
            } catch (error) {
                console.error("Error signing out: ", error);
            }
        });
    }

    // ==========================================
    // 2. Real-Time Bookings Fetcher
    // ==========================================
    
    function fetchBookings() {
        // Query the 'bookings' collection, ordered by newest first
        const bookingsRef = collection(db, "bookings");
        const q = query(bookingsRef, orderBy("createdAt", "desc"));
        
        // Listen for real-time updates
        unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
            tableBody.innerHTML = ''; // Clear existing rows
            
            if (snapshot.empty) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="px-6 py-8 text-center text-sm text-gray-500">
                            No bookings found.
                        </td>
                    </tr>`;
                return;
            }

            snapshot.forEach((documentSnapshot) => {
                const booking = documentSnapshot.data();
                const id = documentSnapshot.id;
                
                const tr = document.createElement('tr');
                tr.className = "hover:bg-gray-50 transition-colors";
                
                // Determine Status Badge Styling
                let statusBadge = '';
                if (booking.status === 'pending') {
                    statusBadge = `<span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>`;
                } else if (booking.status === 'accepted') {
                    statusBadge = `<span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Accepted</span>`;
                } else {
                    statusBadge = `<span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>`;
                }

                // Determine Action Buttons (Only show Accept/Reject if pending)
                let actionButtons = '';
                if (booking.status === 'pending') {
                    actionButtons = `
                        <button data-id="${id}" data-action="accept" class="text-green-600 hover:text-green-900 font-semibold mr-4 transition-colors">Accept</button>
                        <button data-id="${id}" data-action="reject" class="text-red-600 hover:text-red-900 font-semibold transition-colors">Reject</button>
                    `;
                } else {
                    actionButtons = `<span class="text-gray-400 text-sm italic">Resolved</span>`;
                }

                // Build the table row HTML
                tr.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">${booking.date}</div>
                        <div class="text-sm text-gray-500">${booking.time}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">${booking.name}</div>
                        <div class="text-sm text-gray-500">${booking.email}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div class="flex items-center">
                            <svg class="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            ${booking.guests} ${booking.guests > 1 ? 'Guests' : 'Guest'}
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        ${statusBadge}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        ${actionButtons}
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        }, (error) => {
            console.error("Error fetching bookings: ", error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-4 text-center text-sm text-red-500">
                        Error loading bookings. Please verify your permissions.
                    </td>
                </tr>`;
        });
    }

    // ==========================================
    // 3. Admin Actions (Accept / Reject)
    // ==========================================
    
    // Use Event Delegation on the table body to handle dynamic buttons
    if (tableBody) {
        tableBody.addEventListener('click', async (e) => {
            // Check if a button was clicked
            if (e.target.tagName === 'BUTTON') {
                const id = e.target.getAttribute('data-id');
                const action = e.target.getAttribute('data-action');
                
                if (id && action) {
                    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
                    const bookingRef = doc(db, "bookings", id);
                    
                    try {
                        // Optimistic UI update: disable button to prevent double-clicks
                        e.target.disabled = true;
                        e.target.innerText = 'Processing...';
                        
                        // Update the document in Firestore
                        await updateDoc(bookingRef, {
                            status: newStatus
                        });
                        
                        // Note: We don't need to manually update the DOM here because 
                        // the onSnapshot listener will automatically detect the change 
                        // and re-render the table with the new status.
                        
                    } catch (error) {
                        console.error(`Error updating document to ${newStatus}: `, error);
                        alert("Failed to update booking status. Please try again.");
                        
                        // Re-enable button if it failed
                        e.target.disabled = false;
                        e.target.innerText = action === 'accept' ? 'Accept' : 'Reject';
                    }
                }
            }
        });
    }
});