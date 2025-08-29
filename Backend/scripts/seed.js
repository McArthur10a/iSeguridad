const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Importar modelos
const { User, Shift, Event } = require('../models');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/security_shifts', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Conectado a MongoDB');
    } catch (error) {
        console.error('Error conectando a MongoDB:', error);
        process.exit(1);
    }
};

const clearDatabase = async () => {
    try {
        await User.deleteMany({});
        await Shift.deleteMany({});
        await Event.deleteMany({});
        console.log('Base de datos limpiada');
    } catch (error) {
        console.error('Error limpiando la base de datos:', error);
    }
};

const seedUsers = async () => {
    try {
        const saltRounds = 10;

        // Crear usuario administrador
        const adminPassword = await bcrypt.hash('admin123', saltRounds);
        const admin = new User({
            name: 'Administrador del Sistema',
            email: 'admin@security.com',
            password: adminPassword,
            role: 'admin'
        });

        // Crear usuarios guardias de prueba
        const guards = [
            {
                name: 'Juan Pérez',
                email: 'juan.perez@security.com',
                password: await bcrypt.hash('guard123', saltRounds),
                role: 'guard'
            },
            {
                name: 'María López',
                email: 'maria.lopez@security.com',
                password: await bcrypt.hash('guard123', saltRounds),
                role: 'guard'
            },
            {
                name: 'Carlos García',
                email: 'carlos.garcia@security.com',
                password: await bcrypt.hash('guard123', saltRounds),
                role: 'guard'
            },
            {
                name: 'Ana Fernández',
                email: 'ana.fernandez@security.com',
                password: await bcrypt.hash('guard123', saltRounds),
                role: 'guard'
            },
            {
                name: 'Luis Rodríguez',
                email: 'luis.rodriguez@security.com',
                password: await bcrypt.hash('guard123', saltRounds),
                role: 'guard'
            }
        ];

        // Guardar usuarios
        await admin.save();
        const savedGuards = await User.insertMany(guards);
        
        console.log('Usuarios creados exitosamente');
        console.log('Admin: admin@security.com / admin123');
        console.log('Guardias: [nombre]@security.com / guard123');
        
        return { admin, guards: savedGuards };
    } catch (error) {
        console.error('Error creando usuarios:', error);
    }
};

const seedShifts = async (guards) => {
    try {
        const puestos = ['REGISTRO', 'ENTRADA PRINCIPAL', 'SOTANO', 'HALL BANCARIO', 'CUBICULO', 'ESCLUSA', 'CCTV'];
        const timeSlots = ['00:00-08:00', '08:00-16:00', '16:00-24:00'];
        const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        
        const shifts = [];
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1); // Primer día del mes actual
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Último día del mes actual

        // Generar turnos para cada día del mes actual
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = diasSemana[d.getDay() === 0 ? 6 : d.getDay() - 1];
            
            guards.forEach(guard => {
                // 70% probabilidad de tener turno, 30% día libre
                const hasShift = Math.random() > 0.3;
                
                if (hasShift) {
                    const randomPuesto = puestos[Math.floor(Math.random() * puestos.length)];
                    const randomTimeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
                    
                    shifts.push({
                        guardId: guard._id,
                        date: new Date(d),
                        dayOfWeek,
                        puesto: randomPuesto,
                        timeSlot: randomTimeSlot
                    });
                } else {
                    shifts.push({
                        guardId: guard._id,
                        date: new Date(d),
                        dayOfWeek,
                        puesto: 'LIBRE',
                        timeSlot: 'Libre'
                    });
                }
            });
        }

        await Shift.insertMany(shifts);
        console.log(`${shifts.length} turnos creados para el mes actual`);
    } catch (error) {
        console.error('Error creando turnos:', error);
    }
};

const seedEvents = async (adminId) => {
    try {
        const events = [
            {
                title: 'Capacitación en Seguridad',
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // En una semana
                description: 'Capacitación mensual obligatoria para todo el personal de seguridad',
                createdBy: adminId
            },
            {
                title: 'Simulacro de Emergencia',
                date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // En dos semanas
                description: 'Simulacro de evacuación y procedimientos de emergencia',
                createdBy: adminId
            },
            {
                title: 'Reunión Mensual',
                date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // En tres semanas
                description: 'Reunión mensual de coordinación y revisión de procedimientos',
                createdBy: adminId
            }
        ];

        await Event.insertMany(events);
        console.log(`${events.length} eventos creados exitosamente`);
    } catch (error) {
        console.error('Error creando eventos:', error);
    }
};

const seedDatabase = async () => {
    try {
        await connectDB();
        await clearDatabase();
        
        const { admin, guards } = await seedUsers();
        await seedShifts(guards);
        await seedEvents(admin._id);
        
        console.log('✅ Base de datos inicializada exitosamente');
        console.log('🔑 Credenciales de acceso:');
        console.log('   Admin: admin@security.com / admin123');
        console.log('   Guardias: [nombre]@security.com / guard123');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error inicializando la base de datos:', error);
        process.exit(1);
    }
};

// Ejecutar el seeder solo si se llama directamente
if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase };