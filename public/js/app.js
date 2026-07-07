import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    const bookingForm = document.getElementById('booking-form');
    const successMessage = document.getElementById('success-message');
    const submitBtn = document.getElementById('submit-btn');

    // Set minimum date to today
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);

    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Disable button to prevent double submission
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Processing...';

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const date = document.getElementById('date').value;
        const time = document.getElementById('time').value;
        const guests = document.getElementById('guests').value;

        try {
            // Write to Firestore
            await addDoc(collection(db, "bookings"), {
                name: name,
                email: email,
                date: date,
                time: time,
                guests: parseInt(guests),
                status: 'pending',
                createdAt: serverTimestamp()
            });

            // Show success UI
            bookingForm.reset();
            successMessage.classList.remove('hidden');
            successMessage.classList.add('flex');
            
            // Hide success message after 5 seconds
            setTimeout(() => {
                successMessage.classList.add('hidden');
                successMessage.classList.remove('flex');
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Request Booking';
            }, 5000);

        } catch (error) {
            console.error("Error adding document: ", error);
            alert("There was an error submitting your booking. Please try again.");
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Request Booking';
        }
    });
});