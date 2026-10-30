import random, sqlite3, os
random.seed(2026)

def q(v):
    if v is None: return "NULL"
    if isinstance(v, (int, float)): return str(v)
    return "'" + str(v).replace("'", "''") + "'"

out = []
def insert(table, cols, rows):
    out.append(f"-- {table}")
    for r in rows:
        out.append(f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({', '.join(q(x) for x in r)});")
    out.append("")

# ------------------------------------------------------------------ master
insert("departments", ["id","code","name"], [
    (1,"CSE","Computer Science & Engineering"),
    (2,"ASH","Applied Sciences & Humanities"),
])

rooms = [
    (1,"LH-301","Lecture Hall 301","Academic Block A",3,70,"Lecture Hall"),
    (2,"LH-205","Lecture Hall 205","Academic Block A",2,70,"Lecture Hall"),
    (3,"LH-104","Lecture Hall 104","Academic Block A",1,70,"Lecture Hall"),
    (4,"LAB-CSE2","CSE Lab 2 (Analytics Lab)","Academic Block B",2,40,"Lab"),
    (5,"LAB-PROJ","Project Lab","Academic Block B",3,40,"Lab"),
    (6,"SEM-HALL","Seminar Hall","Admin Block",1,150,"Seminar Hall"),
]
for i in range(1, 11):
    rooms.append((6+i, f"CAB-A{300+i}", f"Faculty Cabin {300+i}", "Academic Block A", 3, 3, "Cabin"))
insert("rooms", ["id","code","name","building","floor","capacity","room_type"], rooms)

# (id, code, name, email, phone, designation, dept, joined, source)
faculty = [
    (1,"AJU-F001","Dilip Kumar","dilip.kumar@aju.example","Associate Professor",1,"2014-07-15","screenshot"),
    (2,"AJU-F002","Megha Sinha","megha.sinha@aju.example","Assistant Professor",1,"2018-08-01","screenshot"),
    (3,"AJU-F003","Mamatha Vayelapelli","mamatha.vayelapelli@aju.example","Associate Professor",1,"2013-01-10","screenshot"),
    (4,"AJU-F004","Chandra Prabha Sahu","chandraprabha.sahu@aju.example","Professor",2,"2009-06-20","screenshot"),
    (5,"AJU-F005","Sayantani De","sayantani.de@aju.example","Assistant Professor",1,"2019-07-22","screenshot"),
    (6,"AJU-F006","Rahul Verma","rahul.verma@aju.example","Assistant Professor",1,"2020-01-06","sample"),
    (7,"AJU-F007","Anita Sharma","anita.sharma@aju.example","Associate Professor",1,"2012-08-13","sample"),
    (8,"AJU-F008","Sanjay Mishra","sanjay.mishra@aju.example","Professor",1,"2008-07-01","sample"),
    (9,"AJU-F009","Priya Nair","priya.nair@aju.example","Assistant Professor",1,"2021-02-15","sample"),
    (10,"AJU-F010","Arvind Prasad","arvind.prasad@aju.example","Assistant Professor",1,"2017-09-04","sample"),
]
rows = []
for (i, code, name, email, desig, dept, joined, src) in faculty:
    rows.append((i, code, name, email, f"+91-90000-{i:05d}", desig, dept, 6+i, joined, 1, src))
insert("faculty", ["id","employee_code","full_name","email","phone","designation","department_id","cabin_room_id","joined_on","is_active","source"], rows)
fname = {f[0]: f[2] for f in faculty}

users = [(1,"admin@aju.example","REPLACE_WITH_BCRYPT_HASH","admin",None)]
for f in faculty:
    users.append((f[0]+1, f[3], "REPLACE_WITH_BCRYPT_HASH", "faculty", f[0]))
insert("users", ["id","email","password_hash","role","faculty_id"], users)

insert("sections", ["id","program","branch","semester","section_name","academic_year","strength","home_room_id"], [
    (1,"B.Tech","CSE",7,"A","2026-27",58,1),
    (2,"B.Tech","CSE",5,"A","2026-27",62,2),
    (3,"B.Tech","CSE",3,"A","2026-27",64,3),
])

courses = [
    (1,"BTE27182","Cryptography & Network Security","Elective-IV",3,1,"screenshot"),
    (2,"BTE27336","Quantum Computing","Elective-V",3,1,"screenshot"),
    (3,"BTE27339","Data mining and warehousing","Open Elective-II",3,1,"screenshot"),
    (4,"BTE23018","Biology For Engineers","Core",2,2,"screenshot"),
    (5,"BTE27396","Data Analytics","Core",3,1,"screenshot"),
    (6,"BTE27348","Minor Project","Project",2,1,"screenshot"),
    (7,"BTE27324","Summer Internship-II (4-6 Week)","Internship",2,1,"screenshot"),
    (8,"BTE27410","Machine Learning","Core",4,1,"sample"),
    (9,"BTE27415","Cloud Computing","Core",3,1,"sample"),
    (10,"BTE27420","Software Engineering","Core",3,1,"sample"),
    (11,"BTE27425","Computer Networks","Core",3,1,"sample"),
    (12,"BTE27430","Database Management Systems","Core",3,1,"sample"),
]
insert("courses", ["id","code","title","category","credits","department_id","source"], courses)

# assignment id -> (course, faculty, section)
assign = {1:(1,1,1),2:(2,2,1),3:(3,3,1),4:(4,4,1),5:(5,5,1),6:(6,3,1),7:(7,7,1),
          8:(8,6,2),9:(9,7,2),10:(10,8,2),11:(11,9,3),12:(12,10,3)}
insert("course_assignments", ["id","course_id","faculty_id","section_id"],
       [(k,)+v for k,v in assign.items()])

periods = [(1,"P1","08:00","08:45"),(2,"P2","08:45","09:30"),(3,"P3","10:00","10:45"),
           (4,"P4","10:45","11:30"),(5,"P5","11:30","12:15"),(6,"P6","12:30","13:15")]
insert("periods", ["id","label","start_time","end_time"], periods)
pstart = {p[0]:p[2] for p in periods}; pend = {p[0]:p[3] for p in periods}

# ------------------------------------------------------------------ timetable
D = ["Monday","Tuesday","Wednesday","Thursday","Friday"]
grid = {  # Sem 7 A - taken from the timetable screenshot  (period -> assignment per day)
    1: [3,1,3,1,3],
    2: [1,6,1,3,6],
    4: [4,5,2,4,5],
    5: [5,2,4,2,4],
}
slots = []  # (assignment, day, period, room)
for p, row in grid.items():
    for d, a in zip(D, row):
        room = {5:4, 6:5}.get(a, 1)
        slots.append((a, d, p, room))
extra = {  # added sample sections
    8:  [("Monday",1),("Tuesday",2),("Thursday",4),("Friday",5)],
    9:  [("Monday",2),("Wednesday",1),("Thursday",5),("Friday",1)],
    10: [("Tuesday",1),("Wednesday",2),("Monday",4),("Friday",4)],
    11: [("Monday",1),("Tuesday",4),("Wednesday",2),("Thursday",5)],
    12: [("Monday",4),("Tuesday",1),("Thursday",2),("Friday",5)],
}
for a, lst in extra.items():
    room = {1:1,2:2,3:3}[assign[a][2]]
    for d, p in lst:
        slots.append((a, d, p, room))
rows = []
slot_info = {}
for i, (a, d, p, room) in enumerate(slots, 1):
    _, fid, sid = assign[a]
    rows.append((i, a, fid, sid, d, p, room))
    slot_info[i] = dict(a=a, f=fid, s=sid, day=d, p=p, room=room)
insert("timetable_slots", ["id","assignment_id","faculty_id","section_id","day_of_week","period_id","room_id"], rows)
find_slot = lambda a, d, p: next(i for i, s in slot_info.items() if (s['a'], s['day'], s['p']) == (a, d, p))

# ------------------------------------------------------------------ syllabus
syl = {
1: [("Introduction & Classical Ciphers","Security goals, attacks, substitution and transposition ciphers"),
    ("Symmetric Key Cryptography","Block ciphers, DES, AES, modes of operation"),
    ("Public Key Cryptography","RSA, Diffie-Hellman, ECC, key exchange"),
    ("Hash Functions & Digital Signatures","MD5, SHA family, MAC, DSA, certificates"),
    ("Network Security Protocols","SSL/TLS, IPSec, firewalls, intrusion detection")],
2: [("Qubits & Quantum States","Superposition, Bloch sphere, measurement"),
    ("Quantum Gates & Circuits","Pauli, Hadamard, CNOT, universal gate sets"),
    ("Basic Quantum Algorithms","Deutsch-Jozsa, Bernstein-Vazirani, Grover search"),
    ("Shor's Algorithm & QFT","Quantum Fourier transform, period finding, factoring"),
    ("Error Correction & Hardware","Noise models, stabilizer codes, superconducting and ion-trap qubits")],
3: [("Data Warehousing & OLAP","DW architecture, star/snowflake schema, OLAP operations"),
    ("Data Preprocessing","Cleaning, integration, reduction, discretization"),
    ("Association Rule Mining","Apriori, FP-Growth, interestingness measures"),
    ("Classification & Prediction","Decision trees, Naive Bayes, rule-based classifiers"),
    ("Clustering & Outlier Detection","k-means, hierarchical, DBSCAN, outlier analysis")],
4: [("Cell: The Basic Unit of Life","Prokaryotes vs eukaryotes, cell organelles"),
    ("Biomolecules","Carbohydrates, lipids, proteins, nucleic acids, enzymes"),
    ("Genetics & Heredity","Mendel's laws, DNA replication, gene expression"),
    ("Human Physiology & Bio-inspired Design","Nervous, circulatory systems, biomimetics"),
    ("Bioengineering Applications","Biosensors, tissue engineering, bioinformatics intro")],
5: [("Introduction to Data Analytics","Data lifecycle, types of analytics, tools"),
    ("Statistics & Exploratory Analysis","Descriptive stats, distributions, EDA, visualization"),
    ("Regression & Predictive Modelling","Linear/logistic regression, evaluation metrics"),
    ("Time Series & Text Analytics","ARIMA, forecasting, text mining basics"),
    ("Big Data Tools & Dashboards","Hadoop/Spark overview, BI dashboards, case studies")],
6: [("Problem Identification & Literature Review","Topic selection, survey of existing work"),
    ("Design & Planning","Requirements, architecture, timeline"),
    ("Implementation","Module development, version control"),
    ("Testing & Results","Test cases, evaluation, analysis"),
    ("Report & Presentation","Documentation, demo, viva")],
7: [("Internship Planning","Company selection, objectives, approval letter"),
    ("Industry Training","Hands-on work under mentor"),
    ("Mid-term Review","Progress report and mentor feedback"),
    ("Final Report","Report preparation and plagiarism check"),
    ("Viva-Voce","Presentation and evaluation")],
8: [("Introduction to Machine Learning","Types of learning, bias-variance, workflow"),
    ("Supervised Learning","Regression, SVM, decision trees, ensembles"),
    ("Unsupervised Learning","Clustering, PCA, dimensionality reduction"),
    ("Neural Networks","Perceptron, backpropagation, CNN basics"),
    ("Model Evaluation & Deployment","Cross-validation, tuning, MLOps overview")],
9: [("Cloud Fundamentals","Service and deployment models, virtualization"),
    ("Cloud Infrastructure & Storage","IaaS, compute, storage, networking"),
    ("Platform Services & Containers","PaaS, Docker, Kubernetes basics"),
    ("Cloud Security & Governance","IAM, compliance, shared responsibility"),
    ("Cloud Case Studies","AWS, Azure, GCP comparison, cost optimization")],
10: [("Software Process Models","Waterfall, Agile, Scrum, DevOps"),
     ("Requirements Engineering","Elicitation, SRS, use cases"),
     ("Design & Architecture","UML, design patterns, architectural styles"),
     ("Testing & Quality","Unit, integration, system testing, metrics"),
     ("Maintenance & Project Management","Estimation, risk, configuration management")],
11: [("Network Basics & Models","OSI, TCP/IP, topologies, switching"),
     ("Data Link & MAC Layer","Framing, error control, Ethernet, Wi-Fi"),
     ("Network Layer","IP addressing, routing algorithms, ICMP"),
     ("Transport Layer","TCP, UDP, congestion control"),
     ("Application Layer & Security","DNS, HTTP, SMTP, basic network security")],
12: [("Database Concepts & ER Modelling","DBMS architecture, ER model, EER"),
     ("Relational Model & SQL","Relational algebra, DDL/DML, joins, views"),
     ("Normalization","Functional dependencies, 1NF-BCNF"),
     ("Transactions & Concurrency","ACID, serializability, locking, recovery"),
     ("Indexing & NoSQL","B+ trees, hashing, query processing, NoSQL overview")],
}
unit_rows, unit_id = [], {}
uid = 1
for cid, units in syl.items():
    for n, (t, topics) in enumerate(units, 1):
        unit_rows.append((uid, cid, n, t, topics, random.choice([8,9,10])))
        unit_id[(cid, n)] = (uid, t); uid += 1
insert("syllabus_units", ["id","course_id","unit_no","title","topics","planned_hours"], unit_rows)

prog_level = {1:(3,40),2:(2,60),3:(3,20),4:(2,80),5:(3,50),6:(2,50),7:(1,50),
              8:(3,30),9:(2,70),10:(3,10),11:(2,40),12:(3,60)}
prog_rows, topic_now = [], {}
pid = 1
for a, (done, part) in prog_level.items():
    cid = assign[a][0]
    for n in range(1, 6):
        u, title = unit_id[(cid, n)]
        if n <= done: st, pct = "completed", 100
        elif n == done + 1 and part > 0: st, pct = "in_progress", part; topic_now[a] = title
        else: st, pct = "not_started", 0
        upd = f"2026-10-{random.randint(20,30)}" if st != "not_started" else None
        prog_rows.append((pid, a, u, st, pct, upd)); pid += 1
    topic_now.setdefault(a, unit_id[(cid, done)][1])
insert("syllabus_progress", ["id","assignment_id","unit_id","status","completion_pct","updated_on"], prog_rows)

# ------------------------------------------------------------------ leave / substitution
leave = [
 (1,1,"Medical","2026-10-27","2026-10-27","Fever - doctor's advice","approved","2026-10-26 18:10",1,"2026-10-26 19:00"),
 (2,7,"Casual","2026-10-29","2026-10-29","Family function","approved","2026-10-27 11:20",1,"2026-10-27 15:45"),
 (3,3,"Duty","2026-11-02","2026-11-03","Attending national conference on Data Science","pending","2026-10-29 10:05",None,None),
 (4,2,"Casual","2026-11-03","2026-11-03","Personal work","rejected","2026-10-28 09:30",1,"2026-10-29 12:00"),
]
insert("leave_requests", ["id","faculty_id","leave_type","from_date","to_date","reason","status","applied_at","reviewed_by_user_id","reviewed_at"], leave)

sub_anita = find_slot(9,"Thursday",5)
sub_mam1  = find_slot(3,"Monday",1)
sub_mam2  = find_slot(6,"Tuesday",2)
sub_megha = find_slot(2,"Tuesday",5)
subs = [
 (1,sub_anita,"2026-10-29",7,8,"Approved casual leave","approved","2026-10-28 09:00",1,"2026-10-28 12:30","Approved"),
 (2,sub_mam1,"2026-11-02",3,5,"Attending national conference","pending","2026-10-29 10:10",None,None,None),
 (3,sub_mam2,"2026-11-03",3,4,"Attending national conference","pending","2026-10-29 10:12",None,None,None),
 (4,sub_megha,"2026-11-03",2,9,"Personal work","rejected","2026-10-28 09:35",1,"2026-10-29 12:05","Substitute not suitable for Quantum Computing; reschedule instead"),
]
insert("substitution_requests", ["id","slot_id","session_date","original_faculty_id","substitute_faculty_id","reason","status","requested_at","reviewed_by_user_id","reviewed_at","review_note"], subs)
# safety: substitutes must be free
for (_, sl, date, orig, sub, *_r) in subs:
    day, p = slot_info[sl]['day'], slot_info[sl]['p']
    assert not any(s['f']==sub and s['day']==day and s['p']==p for s in slot_info.values()), "substitute busy"

# ------------------------------------------------------------------ sessions (week 26-30 Oct 2026)
dates = dict(zip(D, ["2026-10-26","2026-10-27","2026-10-28","2026-10-29","2026-10-30"]))
sess, sid = [], 1
for i, s in slot_info.items():
    d = dates[s['day']]; strength = {1:58,2:62,3:64}[s['s']]
    status, by, rem = "completed", s['f'], None
    start = pstart[s['p']]; end = pend[s['p']]
    present = int(strength * random.uniform(0.82, 0.97))
    if i == sub_anita: status, by, rem = "substituted", 8, "Taken by Sanjay Mishra (approved substitution)"
    if (s['a'], s['day'], s['p']) == (1, "Tuesday", 1): status, by, rem, start, end, present = "cancelled", None, "Faculty on approved medical leave", None, None, None
    if status in ("completed","substituted"):
        hh, mm = map(int, start.split(":")); mm += random.randint(0,3)
        start = f"{hh:02d}:{mm:02d}"
        hh, mm = map(int, end.split(":")); mm -= random.randint(0,2)
        end = f"{hh:02d}:{mm:02d}"
    topic = topic_now[s['a']] if status != "cancelled" else None
    sess.append((sid, i, d, status, start, end, by, topic, present, rem)); sid += 1
insert("class_sessions", ["id","slot_id","session_date","status","actual_start","actual_end","conducted_by_faculty_id","topic_covered","students_present","remarks"], sess)

# ------------------------------------------------------------------ presence
def tmin(t): h, m = map(int, t.split(":")); return h*60+m
def tstr(m): return f"{m//60:02d}:{m%60:02d}"
pres, pid = [], 1
for f in faculty:
    fid = f[0]
    for day in D:
        d = dates[day]
        ps = [s['p'] for s in slot_info.values() if s['f']==fid and s['day']==day]
        if (fid, d) == (1, "2026-10-27") or (fid, d) == (7, "2026-10-29"):
            pres.append((pid, fid, d, "On Leave", None, None, None, None)); pid += 1; continue
        if (fid, d) == (6, "2026-10-28"):
            pres.append((pid, fid, d, "Off Campus", None, None, None, None)); pid += 1; continue
        cin = (tmin(pstart[min(ps)]) - random.randint(10,25)) if ps else random.randint(9*60, 9*60+45)
        cout = random.randint(15*60, 17*60+30)
        pres.append((pid, fid, d, "In Campus", tstr(cin), tstr(cout), 6+fid, f"{d} {tstr(cout)}")); pid += 1
insert("faculty_presence", ["id","faculty_id","presence_date","status","check_in","check_out","current_room_id","last_seen_at"], pres)

# ------------------------------------------------------------------ feedback
fb, i = [], 1
for a in (1,2,3,4,5):
    fb.append((i, a, "Done", random.randint(48,57), round(random.uniform(3.8,4.7),1), f"2026-10-{random.randint(15,25)}")); i += 1
for a in (8,9,10,11,12):
    fb.append((i, a, "Pending", 0, None, None)); i += 1
insert("course_feedback_status", ["id","assignment_id","status","response_count","avg_rating","submitted_on"], fb)

open("seed.sql", "w").write("PRAGMA foreign_keys = ON;\nBEGIN;\n\n" + "\n".join(out) + "\nCOMMIT;\n")

# ------------------------------------------------------------------ build DB
if os.path.exists("aju_bot.db"): os.remove("aju_bot.db")
con = sqlite3.connect("aju_bot.db")
con.executescript(open("schema.sql").read())
con.executescript(open("seed.sql").read())
con.commit()
print("built OK")
