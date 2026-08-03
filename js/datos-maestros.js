// ============================================
// DATOS MAESTROS - Control Documental
// Módulo separado de app.js para facilitar
// mantenimiento y auditoría de datos.
// ============================================

const SECTORES = {
    'Collao': [
        { nombre: 'Rogelio Escalona', correo: 'rescalona@concepcion.cl', telefono: '987282050' },
        { nombre: 'Claudio San Martin', correo: 'csanmartin@concepcion.cl', telefono: '929397904' },
        { nombre: 'Luis Subiabre', correo: 'luisubiabre@gmail.com', telefono: '988820164' },
        { nombre: 'Estefania Conejeros', correo: '', telefono: '956973779' }
    ],
    'Rural': [
        { nombre: 'Julio Andrades (delegado)', correo: 'julio.andrades@concepcion.cl', telefono: '985105137' },
        { nombre: 'Jose Lizama', correo: 'jlizama@concepcion.cl', telefono: '996095230' },
        { nombre: 'Gabriel Torres H', correo: 'gabrieltorres.municonce@gmail.com', telefono: '952292838' }
    ],
    'Barrio Norte': [
        { nombre: 'Jorge Sepulveda (delegado)', correo: 'jorge.sepulveda@concepcion.cl', telefono: '989868776' },
        { nombre: 'Michelle Vera', correo: 'mvera@concepcion.cl', telefono: '981858707' },
        { nombre: 'Carolina Gutierrez', correo: 'carigutierrez.nutricion@gmail.com', telefono: '988809583' },
        { nombre: 'Rocio Bruna', correo: 'bruna.rocio.b@gmail.com', telefono: '926271642' },
        { nombre: 'Miguel Carrillo', correo: 'Mac.s.16@hotmail.com', telefono: '983819010' }
    ],
    'Lorenzo Arenas': [
        { nombre: 'Hugo Rodriguez (delegado)', correo: 'hrodriguez@concepcion.cl', telefono: '966345728' },
        { nombre: 'Ana Bastias', correo: 'abastias@concepcion.cl', telefono: '981564284' },
        { nombre: 'Aydee Sandoval', correo: 'asandoval@concepcion.cl', telefono: '951942478' },
        { nombre: 'Mauricio Rodriguez', correo: 'mauricio.rodriguez@concepcion.cl', telefono: '927553445' }
    ],
    'Centro': [
        { nombre: 'Yonathan Quidel', correo: 'yquidel@concepcion.cl', telefono: '995786311' },
        { nombre: 'Pia Cordes', correo: 'pcordes@concepcion.cl', telefono: '989989436' },
        { nombre: 'Nicole Vidal', correo: 'nvidal@concepcion.cl', telefono: '930738977' },
        { nombre: 'Valeria Olea', correo: 'Valeria.olea@concepcion.cl', telefono: '967532205' }
    ]
};

const DERIVADOS = [
    'Victor Lobos', 'Eduardo Cancino SECPLAN', 'Francisco Ojeda SECPLAN', 'Mario Pereira',
    'Alberto Jarpa', 'Felipe Valdebenito', 'Daniel Muñoz', 'Andres Herrera', 'Adrian Vargas',
    'Susana Carrasco'
];

const PROFESIONALES = ['Marcela Flores', 'Mauricio Enriquez'];

const PRIORIDAD_LIMITES = { alta: 48, media: 72, baja: 96 };
