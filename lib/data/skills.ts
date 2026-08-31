import type { SkillCategoryValue } from "@/lib/validation/ai";

export type SkillSeed = {
  slug: string;
  name: string;
  category: SkillCategoryValue;
  description: string;
  aliases: string[];
};

export const SKILL_SEEDS: SkillSeed[] = [
  { slug: "javascript", name: "JavaScript", category: "PROGRAMMING", description: "Core language of the web runtime and modern tooling.", aliases: ["js", "es6", "ecmascript", "vanilla javascript"] },
  { slug: "typescript", name: "TypeScript", category: "PROGRAMMING", description: "Typed superset of JavaScript for large codebases.", aliases: ["ts"] },
  { slug: "python", name: "Python", category: "PROGRAMMING", description: "General purpose language dominant in data and AI work.", aliases: ["py", "python3"] },
  { slug: "java", name: "Java", category: "PROGRAMMING", description: "Enterprise backend language on the JVM.", aliases: ["core java", "java se"] },
  { slug: "csharp", name: "C#", category: "PROGRAMMING", description: "Primary language of the .NET ecosystem.", aliases: ["c sharp", "c-sharp", "dotnet c#"] },
  { slug: "cpp", name: "C++", category: "PROGRAMMING", description: "Systems language for performance critical software.", aliases: ["c plus plus", "cplusplus"] },
  { slug: "go", name: "Go", category: "PROGRAMMING", description: "Concurrent systems language for cloud services.", aliases: ["golang"] },
  { slug: "rust", name: "Rust", category: "PROGRAMMING", description: "Memory safe systems programming language.", aliases: [] },
  { slug: "php", name: "PHP", category: "PROGRAMMING", description: "Server side language powering a large share of the web.", aliases: [] },
  { slug: "ruby", name: "Ruby", category: "PROGRAMMING", description: "Dynamic language known for Rails web development.", aliases: ["ruby on rails language"] },
  { slug: "kotlin", name: "Kotlin", category: "PROGRAMMING", description: "Modern JVM language and Android default.", aliases: [] },
  { slug: "swift", name: "Swift", category: "PROGRAMMING", description: "Apple platform application language.", aliases: ["swiftui language"] },
  { slug: "r-language", name: "R", category: "PROGRAMMING", description: "Statistical computing language.", aliases: ["r lang", "r programming"] },
  { slug: "shell-scripting", name: "Shell Scripting", category: "PROGRAMMING", description: "Automation with bash and POSIX shells.", aliases: ["bash", "zsh", "shell", "sh"] },

  { slug: "react", name: "React", category: "FRAMEWORKS", description: "Component driven UI library for web interfaces.", aliases: ["reactjs", "react.js"] },
  { slug: "nextjs", name: "Next.js", category: "FRAMEWORKS", description: "Full stack React framework with server rendering.", aliases: ["next", "next js"] },
  { slug: "vue", name: "Vue.js", category: "FRAMEWORKS", description: "Progressive JavaScript UI framework.", aliases: ["vuejs", "vue 3"] },
  { slug: "angular", name: "Angular", category: "FRAMEWORKS", description: "Opinionated TypeScript application framework.", aliases: ["angularjs", "angular 2+"] },
  { slug: "nodejs", name: "Node.js", category: "FRAMEWORKS", description: "JavaScript runtime for server side applications.", aliases: ["node", "node js"] },
  { slug: "express", name: "Express.js", category: "FRAMEWORKS", description: "Minimal HTTP framework for Node.js services.", aliases: ["expressjs"] },
  { slug: "nestjs", name: "NestJS", category: "FRAMEWORKS", description: "Structured TypeScript backend framework.", aliases: ["nest"] },
  { slug: "django", name: "Django", category: "FRAMEWORKS", description: "Batteries included Python web framework.", aliases: [] },
  { slug: "flask", name: "Flask", category: "FRAMEWORKS", description: "Lightweight Python web framework.", aliases: [] },
  { slug: "fastapi", name: "FastAPI", category: "FRAMEWORKS", description: "High performance Python API framework.", aliases: ["fast api"] },
  { slug: "spring-boot", name: "Spring Boot", category: "FRAMEWORKS", description: "Java framework for production backend services.", aliases: ["spring", "springboot"] },
  { slug: "dotnet", name: ".NET", category: "FRAMEWORKS", description: "Cross platform application platform from Microsoft.", aliases: ["asp.net", "dot net", "net core"] },
  { slug: "react-native", name: "React Native", category: "FRAMEWORKS", description: "Cross platform mobile development with React.", aliases: ["reactnative"] },
  { slug: "tailwind-css", name: "Tailwind CSS", category: "FRAMEWORKS", description: "Utility first styling framework.", aliases: ["tailwind"] },
  { slug: "redux", name: "Redux", category: "FRAMEWORKS", description: "Predictable state container for JavaScript apps.", aliases: ["redux toolkit"] },

  { slug: "sql", name: "SQL", category: "DATABASES", description: "Query language for relational data.", aliases: ["structured query language", "ansi sql"] },
  { slug: "postgresql", name: "PostgreSQL", category: "DATABASES", description: "Advanced open source relational database.", aliases: ["postgres", "psql"] },
  { slug: "mysql", name: "MySQL", category: "DATABASES", description: "Widely deployed relational database.", aliases: ["mariadb"] },
  { slug: "mongodb", name: "MongoDB", category: "DATABASES", description: "Document oriented NoSQL database.", aliases: ["mongo"] },
  { slug: "redis", name: "Redis", category: "DATABASES", description: "In memory data store for caching and queues.", aliases: [] },
  { slug: "prisma", name: "Prisma ORM", category: "DATABASES", description: "Type safe database toolkit for TypeScript.", aliases: ["prisma orm"] },
  { slug: "elasticsearch", name: "Elasticsearch", category: "DATABASES", description: "Distributed search and analytics engine.", aliases: ["elastic search", "opensearch"] },
  { slug: "data-modeling", name: "Data Modeling", category: "DATABASES", description: "Designing normalized and analytical schemas.", aliases: ["database design", "schema design", "er modeling"] },

  { slug: "aws", name: "AWS", category: "CLOUD", description: "Amazon Web Services cloud platform.", aliases: ["amazon web services", "ec2", "s3", "lambda"] },
  { slug: "azure", name: "Microsoft Azure", category: "CLOUD", description: "Microsoft cloud platform.", aliases: ["azure cloud"] },
  { slug: "gcp", name: "Google Cloud", category: "CLOUD", description: "Google Cloud Platform services.", aliases: ["google cloud platform", "gcloud"] },
  { slug: "serverless", name: "Serverless Architecture", category: "CLOUD", description: "Event driven compute without managed servers.", aliases: ["serverless functions", "faas"] },
  { slug: "cloud-networking", name: "Cloud Networking", category: "CLOUD", description: "VPCs, load balancing, and cloud traffic design.", aliases: ["vpc", "load balancing"] },

  { slug: "docker", name: "Docker", category: "DEVOPS", description: "Container packaging and runtime.", aliases: ["containers", "containerization"] },
  { slug: "kubernetes", name: "Kubernetes", category: "DEVOPS", description: "Container orchestration platform.", aliases: ["k8s", "eks", "gke"] },
  { slug: "ci-cd", name: "CI/CD", category: "DEVOPS", description: "Automated build, test, and release pipelines.", aliases: ["continuous integration", "continuous delivery", "github actions", "jenkins"] },
  { slug: "terraform", name: "Terraform", category: "DEVOPS", description: "Infrastructure as code provisioning.", aliases: ["infrastructure as code", "iac"] },
  { slug: "linux", name: "Linux Administration", category: "DEVOPS", description: "Operating and troubleshooting Linux systems.", aliases: ["unix", "ubuntu", "linux admin"] },
  { slug: "git", name: "Git & Version Control", category: "DEVOPS", description: "Branching, review, and collaboration workflows.", aliases: ["github", "gitlab", "version control", "bitbucket"] },
  { slug: "observability", name: "Monitoring & Observability", category: "DEVOPS", description: "Metrics, logging, and tracing for live systems.", aliases: ["monitoring", "prometheus", "grafana", "logging"] },

  { slug: "machine-learning", name: "Machine Learning", category: "AI_ML", description: "Supervised and unsupervised modelling fundamentals.", aliases: ["ml", "supervised learning"] },
  { slug: "deep-learning", name: "Deep Learning", category: "AI_ML", description: "Neural network architectures and training.", aliases: ["neural networks", "dl"] },
  { slug: "nlp", name: "Natural Language Processing", category: "AI_ML", description: "Language modelling and text understanding.", aliases: ["natural language processing", "text mining"] },
  { slug: "computer-vision", name: "Computer Vision", category: "AI_ML", description: "Image and video understanding models.", aliases: ["cv", "opencv"] },
  { slug: "pytorch", name: "PyTorch", category: "AI_ML", description: "Deep learning framework for research and production.", aliases: ["torch"] },
  { slug: "tensorflow", name: "TensorFlow", category: "AI_ML", description: "End to end machine learning platform.", aliases: ["keras"] },
  { slug: "scikit-learn", name: "scikit-learn", category: "AI_ML", description: "Classical machine learning toolkit for Python.", aliases: ["sklearn"] },
  { slug: "llm-engineering", name: "LLM Application Engineering", category: "AI_ML", description: "Building products on large language models.", aliases: ["llm", "generative ai", "gen ai", "rag"] },
  { slug: "prompt-engineering", name: "Prompt Engineering", category: "AI_ML", description: "Designing reliable structured model instructions.", aliases: ["prompting"] },
  { slug: "mlops", name: "MLOps", category: "AI_ML", description: "Deploying and monitoring models in production.", aliases: ["model deployment", "ml ops"] },

  { slug: "data-analysis", name: "Data Analysis", category: "DATA", description: "Turning raw datasets into decisions.", aliases: ["analytics", "data analytics"] },
  { slug: "pandas", name: "pandas", category: "DATA", description: "Python dataframe manipulation library.", aliases: [] },
  { slug: "numpy", name: "NumPy", category: "DATA", description: "Numerical computing foundation for Python.", aliases: [] },
  { slug: "data-visualization", name: "Data Visualization", category: "DATA", description: "Communicating findings through charts.", aliases: ["matplotlib", "charts", "dashboards", "seaborn"] },
  { slug: "excel", name: "Excel & Spreadsheets", category: "DATA", description: "Spreadsheet modelling and analysis.", aliases: ["microsoft excel", "google sheets", "spreadsheets"] },
  { slug: "power-bi", name: "Power BI", category: "DATA", description: "Microsoft business intelligence platform.", aliases: ["powerbi"] },
  { slug: "tableau", name: "Tableau", category: "DATA", description: "Visual analytics and BI platform.", aliases: [] },
  { slug: "statistics", name: "Statistics", category: "DATA", description: "Inference, distributions, and hypothesis testing.", aliases: ["probability", "statistical analysis"] },
  { slug: "etl", name: "ETL & Data Pipelines", category: "DATA", description: "Moving and transforming data reliably.", aliases: ["data pipelines", "airflow", "dbt", "elt"] },
  { slug: "spark", name: "Apache Spark", category: "DATA", description: "Distributed large scale data processing.", aliases: ["pyspark", "big data"] },

  { slug: "network-security", name: "Network Security", category: "SECURITY", description: "Protecting network perimeters and traffic.", aliases: ["firewall", "ids", "ips"] },
  { slug: "application-security", name: "Application Security", category: "SECURITY", description: "Securing software against common exploits.", aliases: ["appsec", "owasp", "secure coding"] },
  { slug: "penetration-testing", name: "Penetration Testing", category: "SECURITY", description: "Authorized offensive testing of systems.", aliases: ["pentesting", "ethical hacking", "vapt"] },
  { slug: "siem", name: "SIEM & Threat Detection", category: "SECURITY", description: "Centralized security monitoring and alerting.", aliases: ["splunk", "threat detection", "soc"] },
  { slug: "incident-response", name: "Incident Response", category: "SECURITY", description: "Containing and recovering from security events.", aliases: ["forensics", "ir"] },
  { slug: "cryptography", name: "Cryptography", category: "SECURITY", description: "Applied encryption, hashing, and key management.", aliases: ["encryption", "pki"] },
  { slug: "iam", name: "Identity & Access Management", category: "SECURITY", description: "Authentication, authorization, and least privilege.", aliases: ["identity management", "oauth", "sso", "rbac"] },

  { slug: "rest-api", name: "REST API Design", category: "TOOLS", description: "Designing predictable HTTP interfaces.", aliases: ["rest", "restful api", "api design", "http api"] },
  { slug: "graphql", name: "GraphQL", category: "TOOLS", description: "Typed query layer for client driven data.", aliases: ["apollo"] },
  { slug: "testing", name: "Automated Testing", category: "TOOLS", description: "Unit, integration, and end to end testing.", aliases: ["unit testing", "jest", "pytest", "cypress", "qa", "vitest"] },
  { slug: "system-design", name: "System Design", category: "TOOLS", description: "Architecting scalable distributed systems.", aliases: ["architecture", "software architecture", "scalability"] },
  { slug: "html-css", name: "HTML & CSS", category: "TOOLS", description: "Semantic markup and modern layout.", aliases: ["html", "css", "html5", "css3", "scss", "sass"] },
  { slug: "web-performance", name: "Web Performance", category: "TOOLS", description: "Optimizing load and interaction speed.", aliases: ["performance optimization", "core web vitals"] },
  { slug: "accessibility", name: "Web Accessibility", category: "TOOLS", description: "Building interfaces usable by everyone.", aliases: ["a11y", "wcag"] },
  { slug: "figma", name: "Figma", category: "TOOLS", description: "Collaborative interface design tool.", aliases: ["sketch", "adobe xd"] },
  { slug: "ux-research", name: "UX Research", category: "TOOLS", description: "Learning from users to guide design decisions.", aliases: ["user research", "usability testing"] },
  { slug: "ui-design", name: "UI Design", category: "TOOLS", description: "Visual hierarchy, layout, and design systems.", aliases: ["interface design", "visual design", "design systems"] },
  { slug: "postman", name: "API Tooling", category: "TOOLS", description: "Exploring and documenting APIs.", aliases: ["postman", "swagger", "openapi", "insomnia"] },
  { slug: "seo", name: "SEO Fundamentals", category: "TOOLS", description: "Making content discoverable in search.", aliases: ["search engine optimization"] },

  { slug: "problem-solving", name: "Problem Solving", category: "SOFT_SKILLS", description: "Breaking down and resolving ambiguous problems.", aliases: ["analytical thinking", "dsa", "data structures", "algorithms"] },
  { slug: "adaptability", name: "Adaptability", category: "SOFT_SKILLS", description: "Adjusting quickly to changing requirements.", aliases: ["flexibility", "learning agility"] },
  { slug: "time-management", name: "Time Management", category: "SOFT_SKILLS", description: "Prioritising work and meeting commitments.", aliases: ["prioritization", "organization"] },
  { slug: "critical-thinking", name: "Critical Thinking", category: "SOFT_SKILLS", description: "Evaluating evidence before deciding.", aliases: ["reasoning"] },

  { slug: "written-communication", name: "Written Communication", category: "COMMUNICATION", description: "Clear technical writing and documentation.", aliases: ["technical writing", "documentation", "writing"] },
  { slug: "presentation", name: "Presentation Skills", category: "COMMUNICATION", description: "Explaining work to technical and business audiences.", aliases: ["public speaking", "demo skills"] },
  { slug: "stakeholder-management", name: "Stakeholder Management", category: "COMMUNICATION", description: "Aligning expectations across teams.", aliases: ["client communication", "requirements gathering"] },
  { slug: "collaboration", name: "Collaboration", category: "COMMUNICATION", description: "Working effectively in cross functional teams.", aliases: ["teamwork", "cross functional"] },

  { slug: "mentoring", name: "Mentoring", category: "LEADERSHIP", description: "Growing the capability of other engineers.", aliases: ["coaching"] },
  { slug: "team-leadership", name: "Team Leadership", category: "LEADERSHIP", description: "Directing delivery and team health.", aliases: ["people management", "tech lead"] },
  { slug: "product-strategy", name: "Product Strategy", category: "LEADERSHIP", description: "Choosing what to build and why.", aliases: ["product thinking", "product management", "roadmapping"] },
  { slug: "project-management", name: "Project Management", category: "LEADERSHIP", description: "Planning and delivering scoped work.", aliases: ["agile", "scrum", "kanban", "jira", "sprint planning"] },
  { slug: "business-analysis", name: "Business Analysis", category: "LEADERSHIP", description: "Translating business needs into requirements.", aliases: ["requirements analysis", "process mapping", "brd"] },
];

export const SKILL_SLUGS = SKILL_SEEDS.map((skill) => skill.slug);
