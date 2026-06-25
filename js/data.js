// Static pools. Pure data, no DOM. Pools are intentionally large so the
// uniqueness layer in names.js rarely has to regenerate on collision.

// --- Agora enum tokens (verbatim — these feed dropdown / select fields) ---
export const SUBJECT_TYPE = ['tuition', 'enrichment', 'wellbeing']
export const RATE_TYPE = ['take_rate', 'flat_fee']
export const INSTANCE_STATUS = ['approved', 'currently_underway', 'fully_booked']
export const SEND_TO = ['parent', 'class', 'course_instance', 'business_unit', 'venue']
export const PRODUCT_STATUS = ['active', 'archived']
export const PRODUCT_TYPE = ['parent', 'session_pack', 'time_period']
export const VARIANT_TYPE = ['session_pack', 'time_period', 'course_instance']
export const TIME_PERIOD = ['monthly', 'quarterly']
export const PRODUCT_BASE = [
  'Session Pack', 'Term Bundle', 'Monthly Plan', 'Holiday Programme',
  'Care Package', 'Course Access', 'Enrichment Bundle', 'Discovery Pass',
]

// --- Western / English given names (also used as the English name many SG kids carry) ---
export const FIRST_M = [
  'James', 'Liam', 'Noah', 'Ethan', 'Daniel', 'Lucas', 'Henry', 'Owen', 'Jack', 'Leo',
  'Adam', 'Marcus', 'Oscar', 'Felix', 'Theo', 'Caleb', 'Isaac', 'Nathan', 'Julian', 'Aaron',
  'Elliot', 'Gabriel', 'Hugo', 'Miles', 'Reuben', 'Sebastian', 'Toby', 'Vincent', 'Wesley', 'Zachary',
]
export const FIRST_F = [
  'Emma', 'Olivia', 'Ava', 'Sophia', 'Mia', 'Isla', 'Grace', 'Chloe', 'Ruby', 'Leah',
  'Hazel', 'Nora', 'Clara', 'Iris', 'Maya', 'Eliza', 'Faith', 'Hannah', 'Joanna', 'Kayla',
  'Lydia', 'Naomi', 'Phoebe', 'Renee', 'Stella', 'Tessa', 'Vera', 'Wendy', 'Yvonne', 'Zoey',
]
export const LAST = [
  'Smith', 'Johnson', 'Brown', 'Taylor', 'Wilson', 'Davies', 'Evans', 'Walker', 'Roberts', 'Wright',
  'Clarke', 'Morgan', 'Reed', 'Hughes', 'Bennett', 'Carter', 'Foster', 'Hayes', 'Quinn', 'Turner',
  'Mitchell', 'Parker', 'Phillips', 'Coleman', 'Fletcher', 'Sutton', 'Barrett', 'Newman', 'Pearson', 'Sharpe',
]

// --- Stress-test overflow tokens (unbroken long strings) ---
export const LONG_TOKENS = [
  'Featherstonehaughworthington', 'Llanfairpwllgwyngyllgogerych',
  'Supercalifragilisticexpialidocious', 'Aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'Vanderhuffenmeisterschmidtberg', 'Pneumonoultramicroscopicsilicovolcano',
]

// --- Singapore-flavoured address fragments ---
export const STREET = [
  'Terry Rd', 'Maple Ave', 'Oak Lane', 'Cedar St', 'Park View', 'Hill Cres', 'River Way',
  'Garden Walk', 'Birch Close', 'Elm Grove', 'Tampines St 21', 'Bedok Reservoir Rd',
  'Ang Mo Kio Ave 3', 'Clementi Ave 4', 'Serangoon Central', 'Jurong West St 52',
  'Pasir Ris Dr 6', 'Yishun Ring Rd', 'Bukit Batok East Ave 5', 'Hougang Ave 8',
]
export const BUILDINGS = [
  'Sunrise Tower', 'Greenview Residences', 'Maple Court', 'Riverside Plaza',
  'The Sail @ Marina', 'Botanic Gardens Mansion', 'Parc Esta', 'The Interlace',
  'Reflections at Keppel Bay', 'Pinnacle @ Duxton', 'Sky Habitat', 'The Sundeck',
]

// --- Class / org-structure vocabulary (reference fields on the Add New Class form) ---
export const BUSINESS_UNITS = [
  'Agora Tuition', 'Bright Minds Enrichment', 'Little Scholars', 'STEM Academy',
  'Creative Arts Studio', 'Wellbeing Hub', 'Future Leaders', 'Discovery Learning',
  'Genius Lab', 'Harmony Music School', 'Junior Coders', 'Mindful Kids',
]
export const VENUES = [
  'Tampines Hub', 'Jurong East Centre', 'Bishan Campus', 'Bedok Point Studio',
  'Orchard Central', 'Punggol Waterway', 'Clementi Mall', 'Serangoon Gardens',
  'Woodlands Civic', 'Marina One', 'Bukit Timah Plaza', 'Pasir Ris Town',
]
export const PROGRAMMES = [
  'Primary Maths Mastery', 'English Language Arts', 'Junior Coding', 'Science Explorers',
  'Speech & Drama', 'Robotics Builders', 'Creative Writing Lab', 'Chinese Immersion',
  'Phonics Foundations', 'Chess Academy', 'Financial Literacy', 'Mental Sums',
]
export const CLASS_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// --- Course / product vocabulary ---
export const SUBJECTS = [
  'Mathematics', 'English Literacy', 'Science Discovery', 'Coding Basics', 'Art & Craft',
  'Music Fundamentals', 'Public Speaking', 'Robotics', 'Creative Writing', 'Chinese Language',
  'Phonics', 'Chess Strategy', 'Drama & Theatre', 'Financial Literacy', 'Mental Arithmetic',
]
export const LEVELS = ['Foundation', 'Intermediate', 'Advanced', 'Holiday Camp', 'Masterclass']
export const GRADES = ['Nursery', 'K1', 'K2', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'Sec 1', 'Sec 2', 'Sec 3']
export const ALLERGIES = ['Peanuts', 'Dairy', 'Eggs', 'Seafood', 'Gluten', 'Soy', 'Tree nuts', 'Shellfish', 'Sesame']
export const NOTIF_TITLES = ['Session Reminder', 'Schedule Change', 'Payment Reminder', 'Class Update', 'Holiday Notice', 'Term Enrolment']
export const NICKNAMES = [
  'Ace', 'Bao', 'Bella', 'Bun', 'CJ', 'Coco', 'Ella', 'Gigi', 'Jojo', 'Kai', 'Kiki', 'Lulu',
  'Mei', 'Momo', 'Nana', 'Rae', 'Sunny', 'Tim', 'Yoyo', 'Zaza', 'Bobo', 'Dudu', 'Pim', 'Tutu',
]

// --- Chinese characters for the optional "Chinese name" display field ---
export const CN_SUR = ['李', '王', '陈', '张', '刘', '黄', '吴', '杨', '周', '徐', '孙', '马', '汪', '衡', '魏', '佐', '高', '罗', '邓', '梁']
export const CN_GIVEN = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '洋', '艳', '勇', '军', '杰', '娟', '涛', '明', '超', '宇轩', '子轩', '梓涵', '欣怡', '浩然', '雨桐']

// --- SG-realistic name-engine pools (used by names.js, weighted by rough demographics) ---
export const CN_SUR_R = ['Tan', 'Lim', 'Lee', 'Ng', 'Wong', 'Goh', 'Chua', 'Ong', 'Teo', 'Koh', 'Sim', 'Chan', 'Low', 'Toh', 'Yeo', 'Chong', 'Ho', 'Tay', 'Foo', 'Quek', 'Heng', 'Seah', 'Loh', 'Neo']
export const CN_GIV_M = ['Wei Ming', 'Zhi Hao', 'Jun Jie', 'Kai Xin', 'Jia Wei', 'Yong Sheng', 'Wen Jie', 'Hong Yi', 'Jun Hao', 'Zheng Yang', 'Wei Jie', 'Cheng En', 'Xu Heng', 'Ze Kai', 'Rui Jie']
export const CN_GIV_F = ['Hui Ling', 'Jia Hui', 'Mei Ling', 'Xin Yi', 'Hui Min', 'Li Ying', 'Wan Ting', 'Shu Hui', 'Pei Shan', 'Yi Xuan', 'Jia Qi', 'Wen Xin', 'Shu Ting', 'Kai Ling', 'Zi Qi']
export const MY_GIV_M = ['Muhammad Firdaus', 'Ahmad Danial', 'Aiman', 'Iskandar', 'Khairul', 'Hakim', 'Syafiq', 'Zulfadli', 'Ridhwan', 'Amir', 'Haziq', 'Irfan', 'Luqman', 'Nazrul', 'Syahmi']
export const MY_GIV_F = ['Nur Aisyah', 'Siti Nurhaliza', 'Farah', 'Aaliyah', 'Nabilah', 'Zaitun', 'Hidayah', 'Sofea', 'Batrisyia', 'Alya', 'Insyirah', 'Qaseh', 'Damia', 'Marsya', 'Zahra']
export const MY_FATHER = ['Abdullah', 'Rahman', 'Ismail', 'Hassan', 'Osman', 'Yusof', 'Karim', 'Halim', 'Roslan', 'Bakar', 'Salleh', 'Razak', 'Latif', 'Mansor', 'Othman']
export const IN_GIV_M = ['Arjun', 'Suresh', 'Anand', 'Rajesh', 'Kumar', 'Vijay', 'Prakash', 'Ganesh', 'Ravi', 'Dinesh', 'Karthik', 'Naveen', 'Sanjay', 'Hari', 'Mohan']
export const IN_GIV_F = ['Priya', 'Vimala', 'Lakshmi', 'Nisha', 'Deepa', 'Kavitha', 'Anjali', 'Meena', 'Shanti', 'Radha', 'Divya', 'Geetha', 'Sangeetha', 'Uma', 'Revathi']
export const IN_FATHER = ['Ramasamy', 'Krishnan', 'Subramaniam', 'Muthu', 'Raman', 'Govindasamy', 'Nair', 'Pillai', 'Rajoo', 'Selvam', 'Balakrishnan', 'Devan', 'Suppiah', 'Arumugam']
export const EURASIAN_SUR = ['Pereira', 'De Souza', 'Rozario', 'Theseira', 'Aeria', 'Scully', 'Minjoot', 'Klyne', 'De Cruz', 'Shepherdson', 'Oehlers', 'Westerhout']

// --- Fallback lorem (used only when the Faker CDN is unavailable) ---
export const LOREM = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'eiusmod',
  'tempor', 'incididunt', 'labore', 'dolore', 'magna', 'aliqua', 'session', 'enrolment', 'schedule',
  'venue', 'term', 'holiday', 'reminder', 'parent', 'student', 'course', 'attendance', 'payment',
  'class', 'update', 'notice', 'please', 'available', 'confirm', 'details', 'programme', 'teacher',
  'arrive', 'early', 'materials', 'classroom', 'register', 'deadline', 'fee', 'invoice', 'voucher',
]
