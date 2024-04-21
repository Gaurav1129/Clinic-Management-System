const express = require("express");
const bodyParser = require("body-parser");
const moment = require("moment");


const app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Welcome to Health Consultancy');
});

// Ignore requests for favicon.ico
app.get('/favicon.ico', (req, res) => res.status(204));




// Dummy data for demonstration
const appointments = [
    {
        id: 1,
        doctorId: 1,
        patientName: "Alice Smith",
        date: "2024-04-23",
        time: "18:30"
    },
    {
        id: 2,
        doctorId: 2,
        patientName: "Bob Johnson",
        date: "2024-04-24",
        time: "19:00"
    },
    // Add more appointments as needed
];

const doctors = [
    {
        id: 1,
        name: "Dr. John Doe",
        specialty: "General Physician",
        location: "XYZ Clinic",
        consultationSlots: 5, // Number of patients per evening
        schedule: {
            Monday: "18:00-20:00",
            Tuesday: "18:00-20:00",
            Wednesday: "18:00-20:00",
            Thursday: "18:00-20:00",
            Friday: "18:00-20:00",
            Saturday: "18:00-20:00",
            Sunday: "Not Available"
        }
    },
    {
        id: 2,
        name: "Dr. Jane Smith",
        specialty: "Pediatrician",
        location: "ABC Hospital",
        consultationSlots: 4,
        schedule: {
            Monday: "17:00-19:00",
            Tuesday: "17:00-19:00",
            Wednesday: "17:00-19:00",
            Thursday: "17:00-19:00",
            Friday: "Not Available",
            Saturday: "Not Available",
            Sunday: "Not Available"
        }
    },
    // Add more doctors as needed
];


// Endpoint for listing all doctors
app.get('/api/doctors', (req, res) => {
    res.json(doctors.map(doctor => ({
        id: doctor.id,
        name: doctor.name,
        specialty: doctor.specialty,
        location: doctor.location
    })));
});


// Endpoint for getting details of a specific doctor
app.get('/api/doctors/:id', (req, res) => {
    const doctor = doctors.find(d => d.id === parseInt(req.params.id));
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doctor);
});


// Endpoint for checking doctor's availability for a specific date and time
app.get('/api/doctors/:id/availability', (req, res) => {
    const doctor = doctors.find(d => d.id === parseInt(req.params.id));
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    const { date, time } = req.query;
    if (!date || !time) return res.status(400).json({ error: 'Date and time are required' });

    const day = moment(date).format("dddd");
    if (day === 'Sunday') return res.json({ availability: 'Not Available' });

    const timeSlots = doctor.schedule[day];
    if (!timeSlots || timeSlots === 'Not Available') return res.json({ availability: 'Not Available' });


    // Check if current time is within doctor's working hours
    const currentTime = moment(time, 'HH:mm');

    const [startTime, endTime] = timeSlots.split('-').map(time => moment(time, 'HH:mm'));
    if (moment(currentTime, 'HH:mm').isBetween(startTime, endTime)) {
        return res.json({ availability: 'Available' });
    } else {
        return res.json({ availability: 'Not Available' });
    }
});


// Endpoint for booking an appointment with a doctor
app.post('/api/appointments/book', (req, res) => {
    const { doctorId, date, time } = req.body;

    // Check if all required fields are provided
    if (!doctorId || !date || !time) {
        return res.status(400).json({ error: 'Doctor ID, date, and time are required' });
    }

    // Check if the provided doctor ID exists
    const doctor = doctors.find(d => d.id === parseInt(doctorId));
    if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found' });
    }

    // Check if the doctor is available on the provided date and time
    const day = moment(date).format('dddd');
    if (day === 'Sunday' || doctor.schedule[day] === 'Not Available') {
        return res.status(400).json({ error: 'Doctor is not available on Sundays or the provided date' });
    }

    const [startTime, endTime] = doctor.schedule[day].split('-').map(time => moment(time, 'HH:mm'));
    const appointmentTime = moment(time, 'HH:mm'); 

    if (appointmentTime.isBefore(startTime) || appointmentTime.isAfter(endTime)) {
        return res.status(400).json({ error: 'Doctor is not available at the provided time' });
    }

    // Check if the doctor has reached the maximum number of appointments for the day
    const appointmentsForDay = appointments.filter(appt => appt.doctorId === doctorId && moment(appt.date).isSame(date, 'day'));
    if (appointmentsForDay.length >= doctor.consultationSlots) {
        return res.status(400).json({ error: 'Doctor has reached maximum appointments for the day' });
    }

    // Book the appointment
    appointments.push({ doctorId, date, time });
    res.json({ message: 'Appointment booked successfully' });
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
})



