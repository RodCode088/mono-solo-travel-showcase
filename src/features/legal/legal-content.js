const operator = {
  name: "Sebastián Santos Cruz Báez",
  identity: "4-826-2329 DV 30",
  operationNotice: "4-826-2329-2026-574438077",
  tourismRegistration: "33340",
  tourismResolution: "119-1-RNT-N-00105-2026",
  address:
    "Edificio Asturias, Apto. 0081, Calle Dr. Alberto Navarro, El Cangrejo, corregimiento de Bella Vista, distrito y provincia de Panamá",
};

const es = {
  common: {
    label: "Legal",
    updated: "Última actualización: 17 de agosto de 2026",
    contactTitle: "Contacto oficial",
    contactIntro: "Para consultas, cancelaciones o solicitudes sobre datos personales:",
  },
  terminos: {
    title: "Términos y Condiciones",
    summary: "Condiciones de uso del sitio y de la contratación de servicios turísticos y de guiado.",
    sections: [
      {
        heading: "1. Identificación del prestador del servicio",
        paragraphs: [
          "El sitio web y las experiencias ofrecidas bajo la marca Mono Solo Travel son operados de forma profesional e independiente por el siguiente prestador:",
        ],
        facts: [
          ["Nombre", `${operator.name} (persona natural)`],
          ["Documento de identidad / RUC", operator.identity],
          ["Aviso de Operación (MICI)", `${operator.operationNotice} (actividad CIIU 7915 - Guía Turístico)`],
          ["Registro Nacional de Turismo (ATP)", `Guía General Autorizado, registro ${operator.tourismRegistration} (Resolución ${operator.tourismResolution})`],
          ["Domicilio fiscal", operator.address],
          ["Marca comercial", "Mono Solo Travel"],
        ],
        paragraphsAfter: [
          "Mono Solo Travel es la denominación comercial bajo la cual Sebastián Santos Cruz Báez presta servicios profesionales de guiado. Cuando una experiencia requiere transporte terrestre o marítimo, alimentación, entradas u otros servicios, estos pueden ser coordinados con proveedores locales independientes e idóneos.",
        ],
      },
      {
        heading: "2. Objeto y cuenta de usuario",
        paragraphs: [
          "Mono Solo Travel facilita la exploración, solicitud, reserva y gestión de excursiones, senderismo y experiencias guiadas en Panamá.",
          "Actualmente, las reservas realizadas dentro de la plataforma requieren que la persona cree una cuenta e inicie sesión. Si una experiencia ofrece otro canal de solicitud, esa excepción se indicará expresamente en su ficha o por el canal oficial de contacto.",
        ],
      },
      {
        heading: "3. Aceptación y capacidad",
        paragraphs: [
          "Al crear una cuenta o enviar una solicitud de reserva, el usuario declara ser mayor de edad y manifiesta haber leído y aceptado estos Términos y Condiciones, la Política de Privacidad y la Política de Cancelación.",
          "La información suministrada debe ser verdadera, completa y estar actualizada. La cuenta es personal y el usuario es responsable de proteger sus credenciales de acceso.",
        ],
      },
      {
        heading: "4. Reservas, confirmación y pagos",
        paragraphs: [
          "Toda solicitud queda sujeta a disponibilidad, cupo y condiciones de operación. El envío de una solicitud no equivale por sí solo a una confirmación definitiva; el estado de la reserva se mostrará en la plataforma y podrá comunicarse por el canal de contacto registrado.",
          "La reserva en línea no exige pago inmediato. Cuando corresponda realizar un pago, Mono Solo Travel comunicará previamente el importe, el medio disponible y las condiciones aplicables. Los comprobantes o la facturación se emitirán a nombre de Sebastián Santos Cruz Báez conforme al régimen aplicable a personas naturales ante la Dirección General de Ingresos de Panamá.",
        ],
      },
      {
        heading: "5. Seguridad, obligaciones y riesgos",
        paragraphs: [
          "Las actividades al aire libre, acuáticas y de senderismo conllevan riesgos inherentes al entorno. El participante debe seguir las instrucciones de seguridad del guía y comunicar antes de la salida, por el canal oficial, cualquier condición relevante para su participación segura.",
          "El usuario debe llegar al punto de encuentro en la hora indicada, llevar el equipo o documentos informados en la ficha y respetar las normas de los parques, comarcas, autoridades y proveedores involucrados.",
        ],
      },
      {
        heading: "6. Proveedores independientes y responsabilidad",
        paragraphs: [
          "Cuando intervienen lancheros, transportistas, restaurantes u otros proveedores independientes, Mono Solo Travel coordina la experiencia y comunicará los cambios que conozca. No responde por hechos exclusivamente atribuibles a esos terceros o por eventos fuera de su control razonable, sin perjuicio de los derechos que la legislación aplicable reconozca al consumidor.",
        ],
      },
      {
        heading: "7. Ley aplicable y consultas",
        paragraphs: [
          "Estos términos se rigen por las leyes de la República de Panamá. Las consultas o reclamaciones pueden enviarse a los canales oficiales indicados al final de esta página.",
        ],
      },
    ],
  },
  privacidad: {
    title: "Política de Privacidad",
    summary: "Tratamiento y protección de los datos personales de usuarios y viajeros.",
    sections: [
      {
        heading: "1. Responsable del tratamiento",
        paragraphs: [
          `El responsable del tratamiento es ${operator.name}, persona natural que opera bajo la marca Mono Solo Travel, con domicilio en ${operator.address}.`,
        ],
      },
      {
        heading: "2. Datos que recopilamos",
        paragraphs: ["Según la función utilizada, podemos tratar los siguientes datos:"],
        bullets: [
          "Cuenta: nombre completo, correo electrónico, identificador de usuario y credenciales gestionadas por el servicio de autenticación de Supabase.",
          "Perfil: foto de perfil, si el usuario decide subirla.",
          "Reserva: teléfono o WhatsApp, experiencia, fecha, cantidad de viajeros, estado de la reserva y datos de pago o referencia únicamente cuando existan.",
          "Uso de la cuenta: favoritos, reseñas y código de referencia de un aliado cuando el usuario llega mediante un enlace identificado.",
          "Datos técnicos estrictamente necesarios para iniciar sesión, mantener la sesión, proteger la plataforma y recordar preferencias, mediante almacenamiento local o de sesión y registros de seguridad de los proveedores tecnológicos.",
        ],
      },
      {
        heading: "3. Finalidades y bases del tratamiento",
        paragraphs: ["Los datos se utilizan para:"],
        bullets: [
          "crear y administrar la cuenta del usuario;",
          "recibir, confirmar y gestionar reservas;",
          "comunicar puntos de encuentro, cambios climáticos, requisitos y soporte logístico;",
          "mantener favoritos, reseñas y el historial asociado a la cuenta;",
          "prevenir fraude, proteger la plataforma y atender incidentes; y",
          "cumplir obligaciones legales, fiscales, contables, de seguridad o de autoridades competentes.",
        ],
        paragraphsAfter: [
          "El tratamiento se basa, según corresponda, en el consentimiento del titular, la ejecución de la relación contractual o precontractual y el cumplimiento de obligaciones legales.",
        ],
      },
      {
        heading: "4. Almacenamiento, seguridad y terceros",
        paragraphs: [
          "La plataforma utiliza Supabase para base de datos, autenticación y almacenamiento, y Cloudflare para servir el sitio web. Se aplican controles de acceso y medidas técnicas razonables para proteger la información.",
          "No vendemos ni comercializamos datos personales. Solo se comparte la información mínima necesaria con proveedores tecnológicos y con proveedores logísticos indispensables para ejecutar la actividad, por ejemplo, listas de pasajeros para transporte o permisos de acceso.",
        ],
      },
      {
        heading: "5. Conservación",
        paragraphs: [
          "Los datos se conservan mientras la cuenta esté activa o durante el tiempo necesario para gestionar la reserva, atender solicitudes y cumplir obligaciones legales, fiscales, contables y de seguridad. Cuando dejan de ser necesarios, se eliminan o anonimizan de forma razonable, salvo que una norma exija conservarlos por más tiempo.",
        ],
      },
      {
        heading: "6. Derechos del titular",
        paragraphs: [
          "El titular puede solicitar acceso, rectificación, cancelación o eliminación, oposición y portabilidad de sus datos, así como revocar el consentimiento cuando esa sea la base del tratamiento. La solicitud debe identificar al titular y describir claramente lo solicitado.",
          "La eliminación puede estar limitada cuando sea necesario conservar información para cumplir una obligación legal, atender una reclamación o mantener la integridad de una reserva ya ejecutada. También puede presentarse una denuncia ante la Autoridad Nacional de Transparencia y Acceso a la Información (ANTAI).",
        ],
      },
      {
        heading: "7. Menores de edad y cambios",
        paragraphs: [
          "La creación de cuentas y las reservas están dirigidas a personas mayores de edad. Esta política puede actualizarse para reflejar cambios legales u operativos; la fecha vigente se muestra al inicio de la página.",
        ],
      },
    ],
  },
  cancelacion: {
    title: "Política de Cancelación, No-Show y Clima",
    summary: "Reglas aplicables a cancelaciones, inasistencias y condiciones climáticas.",
    sections: [
      {
        heading: "1. Alcance",
        paragraphs: [
          "Esta política aplica salvo que la ficha de una experiencia indique una condición especial por su logística, proveedor, alquiler privado o destino. En ese caso, la condición específica informada antes de reservar prevalece para esa experiencia.",
        ],
      },
      {
        heading: "2. Cancelaciones por parte del cliente",
        bullets: [
          "Más de 24 horas antes del inicio: permite reprogramar la fecha o solicitar el reembolso del importe efectivamente pagado, descontando únicamente las comisiones bancarias o de pasarela no recuperables que correspondan.",
          "Dentro de las 24 horas previas: no genera derecho a reembolso, porque los cupos y servicios de terceros se coordinan con antelación.",
        ],
        paragraphsAfter: [
          "La solicitud se considera recibida cuando llega al correo o WhatsApp oficial indicado al final de esta página. Toda reprogramación queda sujeta a disponibilidad.",
        ],
      },
      {
        heading: "3. No-Show (inasistencia)",
        paragraphs: [
          "La no presentación en el punto y hora acordados imposibilita prestar el servicio y no da derecho a reembolso ni a reprogramación automática.",
        ],
      },
      {
        heading: "4. Clima y fuerza mayor",
        paragraphs: [
          "Por las condiciones tropicales de Panamá, la lluvia moderada no cancela automáticamente una salida. Si el guía autorizado, la Autoridad Marítima de Panamá, el SINAPROC u otra autoridad competente determina que las condiciones comprometen la seguridad del grupo, se ofrecerá una reprogramación sin costo adicional o un crédito utilizable en otra actividad ofrecida por el guía.",
        ],
      },
      {
        heading: "5. Cancelación por parte de Mono Solo Travel",
        paragraphs: [
          "Si Mono Solo Travel o un proveedor esencial cancela la actividad y no es posible prestar el servicio, el cliente podrá elegir entre reprogramar o recibir el reembolso del importe efectivamente pagado por esa actividad.",
        ],
      },
      {
        heading: "6. Walking Tour basado en aportes",
        paragraphs: [
          "Cuando el Casco Antiguo Walking Tour se ofrezca expresamente como recorrido libre basado en aportes o propinas, no habrá penalización económica por cancelar. Se agradece avisar con antelación para liberar el cupo. Esta excepción no elimina el requisito de cuenta para una reserva realizada dentro de la plataforma mientras ese requisito siga activo.",
        ],
      },
    ],
  },
  exencion: {
    title: "Exención de Responsabilidad y Asunción de Riesgo",
    summary:
      "Documento que debe ser firmado o aceptado digitalmente en el sitio web antes del pago o en el punto de recogida.",
    sections: [
      {
        heading: "1. Naturaleza de las actividades y asunción voluntaria del riesgo",
        paragraphs: [
          "El Cliente reconoce que las actividades coordinadas por el organizador incluyen aventuras al aire libre, senderismo en terreno irregular, actividades acuáticas, transporte terrestre y marítimo, y deportes de aventura o de impacto físico.",
          "El Cliente declara conocer los riesgos inherentes asociados a estas actividades, que incluyen, entre otros: lesiones físicas, accidentes de tránsito, condiciones climáticas adversas, mordeduras o picaduras de fauna silvestre o marina, pérdida o daño de bienes personales y, en casos extremos, discapacidad o muerte. El Cliente asume voluntariamente todos y cada uno de esos riesgos.",
        ],
      },
      {
        heading: "2. Servicios de terceros y limitación de responsabilidad",
        paragraphs: [
          "El Cliente entiende y acepta expresamente que la gran mayoría de los servicios de transporte (marítimo, aéreo y/o terrestre), alojamiento, equipo especializado, deportes extremos y guías locales son contratados a través de terceros independientes fuera del control directo del organizador.",
          "En consecuencia, el organizador no asume responsabilidad legal, civil, penal ni financiera alguna por:",
        ],
        bullets: [
          "Negligencia, fallas mecánicas, accidentes, retrasos, cancelaciones o incumplimientos cometidos por dichos proveedores terceros.",
          "Cualquier incidente, lesión, pérdida o daño ocurrido durante la prestación de servicios por parte de un tercero. Toda reclamación legal deberá dirigirse exclusiva y directamente contra el proveedor final del servicio específico.",
        ],
      },
      {
        heading: "3. Salud, condición física y pertenencias personales",
        paragraphs: [
          "El Cliente declara encontrarse en óptimas condiciones físicas y mentales para participar en el servicio reservado y confirma no haber omitido información médica relevante.",
        ],
        bullets: [
          "Bienes personales: el Organizador no es responsable por la pérdida, robo, extravío o daño de pertenencias personales (dispositivos electrónicos, documentos de identidad, pasaportes, dinero, equipaje, etc.) durante las actividades.",
          "Gastos médicos y evacuación: todos los costos derivados de emergencias médicas, medicamentos, traslados hospitalarios o rescates serán asumidos íntegramente por el Cliente o por su seguro médico personal.",
        ],
      },
      {
        heading: "4. Cambios por fuerza mayor y código de conducta",
        bullets: [
          "Fuerza mayor: el Organizador y los proveedores contratados se reservan el derecho de modificar rutas y horarios, o cancelar itinerarios, por condiciones climáticas adversas, desastres naturales, cierres de vías, huelgas o cualquier evento fuera de su control razonable.",
          "Conducta: el Organizador se reserva el derecho de retirar de la experiencia a cualquier participante que ponga en peligro la seguridad del grupo, incurra en actos ilegales, muestre faltas de respeto o se encuentre bajo la influencia de alcohol o sustancias no autorizadas, sin derecho a reembolso.",
        ],
      },
      {
        heading: "5. Renuncia a demandas y jurisdicción",
        paragraphs: [
          "El Cliente renuncia expresamente al derecho de iniciar cualquier acción legal, demanda, reclamación o arbitraje contra Sebastián Santos Cruz o sus asociados por daños, lesiones o pérdidas sufridas durante el desarrollo de las actividades. Este acuerdo se rige por las leyes de la República de Panamá.",
        ],
      },
      {
        heading: "Reconocimiento y conformidad",
        paragraphs: [
          "Al aceptar este documento, confirmo que soy mayor de edad, que he leído cuidadosamente cada cláusula de esta Exención de Responsabilidad y Asunción de Riesgo, y que acepto sus términos libre y voluntariamente.",
          "La aceptación digital marcada en la casilla previa al pago o al envío de la reserva tiene el mismo valor que la firma del documento impreso. Cuando la operación lo requiera, el mismo documento podrá firmarse en físico en el punto de recogida, indicando nombre completo, número de cédula o pasaporte, nacionalidad, firma y fecha.",
        ],
      },
    ],
  },
};

const en = {
  common: {
    label: "Legal",
    updated: "Last updated: August 17, 2026",
    contactTitle: "Official contact",
    contactIntro: "For questions, cancellations, or personal data requests:",
  },
  terminos: {
    title: "Terms and Conditions",
    summary: "Terms for using the website and booking tourism and guiding services.",
    sections: [
      {
        heading: "1. Service provider identification",
        paragraphs: ["The website and experiences offered under the Mono Solo Travel brand are professionally and independently operated by:"],
        facts: [
          ["Name", `${operator.name} (individual service provider)`],
          ["Identity document / tax ID", operator.identity],
          ["MICI Notice of Operation", `${operator.operationNotice} (CIIU 7915 - Tour Guide)`],
          ["National Tourism Registry (ATP)", `Authorized General Guide, registration ${operator.tourismRegistration} (Resolution ${operator.tourismResolution})`],
          ["Tax address", operator.address],
          ["Trade name", "Mono Solo Travel"],
        ],
        paragraphsAfter: [
          "Mono Solo Travel is the trade name under which Sebastián Santos Cruz Báez provides professional guiding services. When an experience requires land or sea transport, meals, admission, or other services, they may be coordinated with qualified independent local providers.",
        ],
      },
      {
        heading: "2. Purpose and user account",
        paragraphs: [
          "Mono Solo Travel facilitates browsing, requesting, booking, and managing excursions, hikes, and guided experiences in Panama.",
          "Bookings made within the platform currently require the traveler to create an account and sign in. If an experience offers another request channel, the exception will be expressly shown on its page or communicated through the official contact channel.",
        ],
      },
      {
        heading: "3. Acceptance and capacity",
        paragraphs: [
          "By creating an account or submitting a booking request, the user states that they are an adult and have read and accepted these Terms and Conditions, the Privacy Policy, and the Cancellation Policy.",
          "Information provided must be truthful, complete, and current. Accounts are personal, and users are responsible for protecting their login credentials.",
        ],
      },
      {
        heading: "4. Bookings, confirmation, and payment",
        paragraphs: [
          "Every request is subject to availability, capacity, and operating conditions. Submitting a request does not by itself constitute final confirmation; booking status is displayed in the platform and may be communicated through the registered contact channel.",
          "Online booking does not require immediate payment. When payment is required, Mono Solo Travel will first communicate the amount, available method, and applicable conditions. Receipts or invoices are issued in the name of Sebastián Santos Cruz Báez under the rules applicable to individuals before Panama's tax authority.",
        ],
      },
      {
        heading: "5. Safety, duties, and risks",
        paragraphs: [
          "Outdoor, water, and hiking activities involve inherent environmental risks. Participants must follow the guide's safety instructions and communicate, through the official channel before departure, any condition relevant to safe participation.",
          "Users must arrive at the meeting point at the stated time, bring the equipment or documents listed for the experience, and follow the rules of parks, Indigenous territories, authorities, and involved providers.",
        ],
      },
      {
        heading: "6. Independent providers and liability",
        paragraphs: [
          "When boat operators, carriers, restaurants, or other independent providers participate, Mono Solo Travel coordinates the experience and communicates known changes. It is not responsible for events exclusively attributable to those providers or outside its reasonable control, without limiting consumer rights under applicable law.",
        ],
      },
      {
        heading: "7. Governing law and questions",
        paragraphs: ["These terms are governed by the laws of the Republic of Panama. Questions or claims may be sent through the official channels listed at the end of this page."],
      },
    ],
  },
  privacidad: {
    title: "Privacy Policy",
    summary: "How user and traveler personal data is processed and protected.",
    sections: [
      {
        heading: "1. Data controller",
        paragraphs: [`The data controller is ${operator.name}, an individual operating under the Mono Solo Travel brand, with an address at ${operator.address}.`],
      },
      {
        heading: "2. Data we collect",
        paragraphs: ["Depending on the feature used, we may process:"],
        bullets: [
          "Account data: full name, email address, user identifier, and credentials managed by Supabase authentication.",
          "Profile data: a profile photo, if the user chooses to upload one.",
          "Booking data: phone or WhatsApp number, experience, date, party size, booking status, and payment or reference details only when they exist.",
          "Account activity: favorites, reviews, and a partner referral code when the user arrives through an identified link.",
          "Technical data strictly needed to sign in, keep a session, secure the platform, and remember preferences through local or session storage and technology-provider security logs.",
        ],
      },
      {
        heading: "3. Purposes and legal grounds",
        paragraphs: ["Personal data is used to:"],
        bullets: [
          "create and manage user accounts;",
          "receive, confirm, and manage bookings;",
          "communicate meeting points, weather changes, requirements, and logistical support;",
          "maintain favorites, reviews, and account history;",
          "prevent fraud, protect the platform, and respond to incidents; and",
          "meet legal, tax, accounting, safety, or competent-authority obligations.",
        ],
        paragraphsAfter: ["Depending on the situation, processing is based on the data subject's consent, steps needed for or performance of a contract, or compliance with legal obligations."],
      },
      {
        heading: "4. Storage, security, and third parties",
        paragraphs: [
          "The platform uses Supabase for database, authentication, and storage services, and Cloudflare to serve the website. Reasonable access controls and technical safeguards are applied.",
          "We do not sell personal data. Only the minimum necessary information is shared with technology providers and logistical providers required to deliver the activity, such as passenger lists for transport or access permits.",
        ],
      },
      {
        heading: "5. Retention",
        paragraphs: ["Data is kept while an account is active or as long as needed to manage bookings, answer requests, and comply with legal, tax, accounting, and security obligations. When no longer needed, it is reasonably deleted or anonymized unless a rule requires longer retention."],
      },
      {
        heading: "6. Data subject rights",
        paragraphs: [
          "Data subjects may request access, correction, cancellation or deletion, objection, and portability, and may withdraw consent when consent is the basis for processing. Requests must identify the data subject and clearly describe what is requested.",
          "Deletion may be limited when information must be retained to comply with a legal duty, address a claim, or preserve the integrity of a completed booking. A complaint may also be filed with Panama's National Authority for Transparency and Access to Information (ANTAI).",
        ],
      },
      {
        heading: "7. Minors and updates",
        paragraphs: ["Account creation and bookings are intended for adults. This policy may be updated to reflect legal or operational changes; the current date appears at the top of the page."],
      },
    ],
  },
  cancelacion: {
    title: "Cancellation, No-Show, and Weather Policy",
    summary: "Rules for cancellations, no-shows, and weather conditions.",
    sections: [
      {
        heading: "1. Scope",
        paragraphs: ["This policy applies unless an experience page states a special condition because of its logistics, provider, private rental, or destination. A specific condition disclosed before booking prevails for that experience."],
      },
      {
        heading: "2. Cancellations by the customer",
        bullets: [
          "More than 24 hours before the start: the customer may reschedule or request a refund of the amount actually paid, less only applicable non-recoverable bank or payment-processing fees.",
          "Within 24 hours of the start: no refund is available because capacity and third-party services are coordinated in advance.",
        ],
        paragraphsAfter: ["A request is considered received when it reaches the official email or WhatsApp listed at the end of this page. Rescheduling is subject to availability."],
      },
      {
        heading: "3. No-show",
        paragraphs: ["Failure to appear at the agreed meeting point and time prevents delivery of the service and does not entitle the customer to a refund or automatic rescheduling."],
      },
      {
        heading: "4. Weather and force majeure",
        paragraphs: ["Because of Panama's tropical conditions, moderate rain does not automatically cancel an activity. If the authorized guide, Panama Maritime Authority, SINAPROC, or another competent authority determines that conditions threaten group safety, Mono Solo Travel will offer free rescheduling or a credit toward another activity offered by the guide."],
      },
      {
        heading: "5. Cancellation by Mono Solo Travel",
        paragraphs: ["If Mono Solo Travel or an essential provider cancels the activity and the service cannot be delivered, the customer may choose between rescheduling and a refund of the amount actually paid for that activity."],
      },
      {
        heading: "6. Contribution-based Walking Tour",
        paragraphs: ["When the Casco Antiguo Walking Tour is expressly offered as a contribution- or tip-based activity, there is no financial cancellation penalty. Advance notice is appreciated so the spot can be released. This exception does not remove the account requirement for bookings made within the platform while that requirement remains active."],
      },
    ],
  },
  // Texto aprobado por el cliente, transcrito verbatim desde
  // "(EN) RELEASE OF LIABILITY AND ASSUMPTION OF RISK.pdf". No reformular.
  exencion: {
    title: "Release of Liability and Assumption of Risk",
    summary: "This document must be signed or digitally accepted on the website prior to payment or at pickup.",
    sections: [
      {
        heading: "1. Nature of Activities and Voluntary Assumption of Risk",
        paragraphs: [
          "The Client acknowledges that the activities coordinated by the organizer involve outdoor adventures, hiking on uneven terrain, water activities, land and maritime transportation, and adventure or physical-impact sports.",
          "The Client declares to be aware of the inherent risks associated with these activities, which include, but are not limited to: physical injury, traffic accidents, adverse weather conditions, bites/stings from wildlife or marine life, loss of or damage to personal property, and, in extreme cases, disability or death. The Client voluntarily assumes any and all such risks.",
        ],
      },
      {
        heading: "2. Third-Party Services and Limitation of Liability",
        paragraphs: [
          "The Client explicitly understands and agrees that the vast majority of transportation services (maritime, air, and/or land), lodging, specialized equipment, extreme sports, and local guides are contracted through independent third parties outside the direct control of the organizer.",
          "Consequently, the organizer assumes no legal, civil, criminal, or financial liability for:",
        ],
        bullets: [
          "Negligence, mechanical failures, accidents, delays, cancellations, or defaults committed by such third-party providers.",
          "Any incident, injury, loss, or harm occurring during the provision of services by a third party. Any legal claims must be directed exclusively and directly against the final provider of the specific service.",
        ],
      },
      {
        heading: "3. Health, Physical Condition, and Personal Belongings",
        paragraphs: [
          "The Client declares to be in optimal physical and mental condition to participate in the booked service and confirms not having omitted relevant medical information.",
        ],
        bullets: [
          "Personal Property: The Organizer is not responsible for the loss, theft, misplacement, or damage of personal belongings (electronic devices, identity documents, passports, money, luggage, etc.) during the activities.",
          "Medical Expenses and Evacuation: All costs arising from medical emergencies, medications, hospital transfers, or rescues shall be borne entirely by the Client or their personal medical insurance.",
        ],
      },
      {
        heading: "4. Force Majeure Changes and Code of Conduct",
        bullets: [
          "Force Majeure: The Organizer and contracted providers reserve the right to modify routes and schedules, or cancel itineraries due to adverse weather conditions, natural disasters, road closures, strikes, or any event beyond reasonable control.",
          "Conduct: The Organizer reserves the right to remove any participant from the experience who endangers group safety, engages in illegal acts, displays disrespect, or is under the influence of alcohol or unauthorized substances, without entitlement to a refund.",
        ],
      },
      {
        heading: "5. Waiver of Lawsuits and Jurisdiction",
        paragraphs: [
          "The Client expressly waives the right to initiate any legal action, lawsuit, claim, or arbitration against Sebastián Santos Cruz or his associates for damages, injuries, or losses incurred during the course of the activities. This agreement is governed by the laws of the Republic of Panama.",
        ],
      },
      {
        heading: "Acknowledgment and Signature of Conformity",
        paragraphs: [
          "By accepting this document, I confirm that I am of legal age, that I have carefully read each clause of this Release of Liability and Assumption of Risk, and that I accept its terms freely and voluntarily.",
          "Digital acceptance through the checkbox shown before payment or before submitting a booking carries the same value as signing the printed document. When the operation requires it, the same document may be signed on paper at pickup, stating the participant's full name, ID or passport number, nationality, signature, and date.",
        ],
      },
    ],
  },
};

export const LEGAL_CONTENT = { es, en };
