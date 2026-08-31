export type ResourceTypeValue =
  | "DOCUMENTATION"
  | "COURSE"
  | "TUTORIAL"
  | "BOOK"
  | "PRACTICE"
  | "VIDEO";

export type ResourceDifficultyValue = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type LearningResourceSeed = {
  skill: string;
  title: string;
  provider: string;
  url: string;
  type: ResourceTypeValue;
  difficulty: ResourceDifficultyValue;
  estimateHrs: number;
};

export const LEARNING_RESOURCE_SEEDS: LearningResourceSeed[] = [
  { skill: "javascript", title: "JavaScript Guide", provider: "MDN Web Docs", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 20 },
  { skill: "javascript", title: "JavaScript Algorithms and Data Structures", provider: "freeCodeCamp", url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/", type: "COURSE", difficulty: "BEGINNER", estimateHrs: 40 },
  { skill: "typescript", title: "TypeScript Handbook", provider: "TypeScript", url: "https://www.typescriptlang.org/docs/handbook/intro.html", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 14 },
  { skill: "python", title: "The Python Tutorial", provider: "Python Software Foundation", url: "https://docs.python.org/3/tutorial/", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 18 },
  { skill: "python", title: "Scientific Computing with Python", provider: "freeCodeCamp", url: "https://www.freecodecamp.org/learn/scientific-computing-with-python/", type: "COURSE", difficulty: "BEGINNER", estimateHrs: 30 },
  { skill: "java", title: "Java Tutorials", provider: "Oracle", url: "https://docs.oracle.com/javase/tutorial/", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 24 },
  { skill: "csharp", title: "C# Documentation", provider: "Microsoft Learn", url: "https://learn.microsoft.com/en-us/dotnet/csharp/", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 20 },
  { skill: "cpp", title: "C++ Language Reference", provider: "cppreference", url: "https://en.cppreference.com/w/cpp/language", type: "DOCUMENTATION", difficulty: "ADVANCED", estimateHrs: 26 },
  { skill: "go", title: "Tour of Go", provider: "Go", url: "https://go.dev/tour/", type: "TUTORIAL", difficulty: "BEGINNER", estimateHrs: 10 },
  { skill: "rust", title: "The Rust Programming Language", provider: "Rust Foundation", url: "https://doc.rust-lang.org/book/", type: "BOOK", difficulty: "INTERMEDIATE", estimateHrs: 32 },
  { skill: "php", title: "PHP Language Reference", provider: "PHP", url: "https://www.php.net/manual/en/langref.php", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 16 },
  { skill: "ruby", title: "Ruby on Rails Guides", provider: "Rails", url: "https://guides.rubyonrails.org/", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 22 },
  { skill: "kotlin", title: "Kotlin Docs", provider: "JetBrains", url: "https://kotlinlang.org/docs/home.html", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 16 },
  { skill: "swift", title: "SwiftUI Tutorials", provider: "Apple", url: "https://developer.apple.com/tutorials/swiftui", type: "TUTORIAL", difficulty: "BEGINNER", estimateHrs: 14 },
  { skill: "r-language", title: "An Introduction to R", provider: "CRAN", url: "https://cran.r-project.org/doc/manuals/r-release/R-intro.html", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 12 },
  { skill: "shell-scripting", title: "Bash Reference Manual", provider: "GNU", url: "https://www.gnu.org/software/bash/manual/bash.html", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 10 },

  { skill: "react", title: "Learn React", provider: "React", url: "https://react.dev/learn", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 20 },
  { skill: "react", title: "Thinking in React", provider: "React", url: "https://react.dev/learn/thinking-in-react", type: "TUTORIAL", difficulty: "BEGINNER", estimateHrs: 3 },
  { skill: "nextjs", title: "Next.js Learn Course", provider: "Vercel", url: "https://nextjs.org/learn", type: "COURSE", difficulty: "INTERMEDIATE", estimateHrs: 16 },
  { skill: "nextjs", title: "Next.js App Router Documentation", provider: "Vercel", url: "https://nextjs.org/docs/app", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 12 },
  { skill: "vue", title: "Vue.js Guide", provider: "Vue", url: "https://vuejs.org/guide/introduction.html", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 16 },
  { skill: "angular", title: "Angular Documentation", provider: "Angular", url: "https://angular.dev/overview", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 20 },
  { skill: "nodejs", title: "Learn Node.js", provider: "OpenJS Foundation", url: "https://nodejs.org/en/learn", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 14 },
  { skill: "express", title: "Express Getting Started", provider: "Express", url: "https://expressjs.com/en/starter/installing.html", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 6 },
  { skill: "nestjs", title: "NestJS Documentation", provider: "NestJS", url: "https://docs.nestjs.com/", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 14 },
  { skill: "django", title: "Django Tutorial", provider: "Django Software Foundation", url: "https://docs.djangoproject.com/en/stable/intro/tutorial01/", type: "TUTORIAL", difficulty: "BEGINNER", estimateHrs: 12 },
  { skill: "flask", title: "Flask Quickstart", provider: "Pallets", url: "https://flask.palletsprojects.com/en/stable/quickstart/", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 6 },
  { skill: "fastapi", title: "FastAPI Tutorial", provider: "FastAPI", url: "https://fastapi.tiangolo.com/tutorial/", type: "TUTORIAL", difficulty: "INTERMEDIATE", estimateHrs: 10 },
  { skill: "spring-boot", title: "Spring Guides", provider: "Spring", url: "https://spring.io/guides", type: "TUTORIAL", difficulty: "INTERMEDIATE", estimateHrs: 18 },
  { skill: "dotnet", title: ".NET Documentation", provider: "Microsoft Learn", url: "https://learn.microsoft.com/en-us/dotnet/", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 20 },
  { skill: "react-native", title: "React Native Getting Started", provider: "Meta", url: "https://reactnative.dev/docs/getting-started", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 14 },
  { skill: "tailwind-css", title: "Tailwind CSS Documentation", provider: "Tailwind Labs", url: "https://tailwindcss.com/docs/styling-with-utility-classes", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 6 },
  { skill: "redux", title: "Redux Essentials Tutorial", provider: "Redux", url: "https://redux.js.org/tutorials/essentials/part-1-overview-concepts", type: "TUTORIAL", difficulty: "INTERMEDIATE", estimateHrs: 8 },

  { skill: "sql", title: "SQL Tutorial", provider: "PostgreSQL", url: "https://www.postgresql.org/docs/current/tutorial-sql.html", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 8 },
  { skill: "sql", title: "Relational Databases Course", provider: "freeCodeCamp", url: "https://www.freecodecamp.org/learn/relational-database/", type: "COURSE", difficulty: "BEGINNER", estimateHrs: 30 },
  { skill: "postgresql", title: "PostgreSQL Documentation", provider: "PostgreSQL", url: "https://www.postgresql.org/docs/current/index.html", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 16 },
  { skill: "mysql", title: "MySQL Reference Manual", provider: "Oracle", url: "https://dev.mysql.com/doc/refman/8.4/en/", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 14 },
  { skill: "mongodb", title: "MongoDB Manual", provider: "MongoDB", url: "https://www.mongodb.com/docs/manual/", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 12 },
  { skill: "redis", title: "Redis Documentation", provider: "Redis", url: "https://redis.io/docs/latest/", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 8 },
  { skill: "prisma", title: "Prisma ORM Documentation", provider: "Prisma", url: "https://www.prisma.io/docs/orm", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 8 },
  { skill: "elasticsearch", title: "Elasticsearch Guide", provider: "Elastic", url: "https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html", type: "DOCUMENTATION", difficulty: "ADVANCED", estimateHrs: 16 },
  { skill: "data-modeling", title: "Database Design Basics", provider: "PostgreSQL", url: "https://www.postgresql.org/docs/current/ddl.html", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 10 },

  { skill: "aws", title: "AWS Getting Started Resource Center", provider: "Amazon Web Services", url: "https://aws.amazon.com/getting-started/", type: "COURSE", difficulty: "BEGINNER", estimateHrs: 20 },
  { skill: "azure", title: "Azure Documentation", provider: "Microsoft Learn", url: "https://learn.microsoft.com/en-us/azure/", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 18 },
  { skill: "gcp", title: "Google Cloud Documentation", provider: "Google Cloud", url: "https://cloud.google.com/docs", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 18 },
  { skill: "serverless", title: "AWS Lambda Developer Guide", provider: "Amazon Web Services", url: "https://docs.aws.amazon.com/lambda/latest/dg/welcome.html", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 10 },
  { skill: "cloud-networking", title: "Amazon VPC User Guide", provider: "Amazon Web Services", url: "https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 10 },

  { skill: "docker", title: "Docker Get Started", provider: "Docker", url: "https://docs.docker.com/get-started/", type: "TUTORIAL", difficulty: "BEGINNER", estimateHrs: 8 },
  { skill: "kubernetes", title: "Kubernetes Tutorials", provider: "CNCF", url: "https://kubernetes.io/docs/tutorials/", type: "TUTORIAL", difficulty: "ADVANCED", estimateHrs: 20 },
  { skill: "ci-cd", title: "GitHub Actions Documentation", provider: "GitHub", url: "https://docs.github.com/en/actions", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 10 },
  { skill: "terraform", title: "Terraform Tutorials", provider: "HashiCorp", url: "https://developer.hashicorp.com/terraform/tutorials", type: "TUTORIAL", difficulty: "INTERMEDIATE", estimateHrs: 14 },
  { skill: "linux", title: "The Linux Command Line", provider: "LinuxCommand.org", url: "https://linuxcommand.org/tlcl.php", type: "BOOK", difficulty: "BEGINNER", estimateHrs: 16 },
  { skill: "git", title: "Pro Git", provider: "Git", url: "https://git-scm.com/book/en/v2", type: "BOOK", difficulty: "BEGINNER", estimateHrs: 12 },
  { skill: "observability", title: "Prometheus Documentation", provider: "CNCF", url: "https://prometheus.io/docs/introduction/overview/", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 10 },

  { skill: "machine-learning", title: "scikit-learn User Guide", provider: "scikit-learn", url: "https://scikit-learn.org/stable/user_guide.html", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 24 },
  { skill: "machine-learning", title: "Machine Learning Crash Course", provider: "Google", url: "https://developers.google.com/machine-learning/crash-course", type: "COURSE", difficulty: "BEGINNER", estimateHrs: 20 },
  { skill: "deep-learning", title: "Deep Learning with PyTorch", provider: "PyTorch", url: "https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html", type: "TUTORIAL", difficulty: "INTERMEDIATE", estimateHrs: 12 },
  { skill: "nlp", title: "Hugging Face NLP Course", provider: "Hugging Face", url: "https://huggingface.co/learn/nlp-course", type: "COURSE", difficulty: "INTERMEDIATE", estimateHrs: 24 },
  { skill: "computer-vision", title: "OpenCV Python Tutorials", provider: "OpenCV", url: "https://docs.opencv.org/4.x/d6/d00/tutorial_py_root.html", type: "TUTORIAL", difficulty: "INTERMEDIATE", estimateHrs: 16 },
  { skill: "pytorch", title: "PyTorch Tutorials", provider: "PyTorch", url: "https://pytorch.org/tutorials/", type: "TUTORIAL", difficulty: "INTERMEDIATE", estimateHrs: 18 },
  { skill: "tensorflow", title: "TensorFlow Tutorials", provider: "TensorFlow", url: "https://www.tensorflow.org/tutorials", type: "TUTORIAL", difficulty: "INTERMEDIATE", estimateHrs: 18 },
  { skill: "scikit-learn", title: "scikit-learn Getting Started", provider: "scikit-learn", url: "https://scikit-learn.org/stable/getting_started.html", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 6 },
  { skill: "llm-engineering", title: "Gemini API Documentation", provider: "Google AI", url: "https://ai.google.dev/gemini-api/docs", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 10 },
  { skill: "llm-engineering", title: "Building with the Claude API", provider: "Anthropic", url: "https://docs.anthropic.com/en/docs/overview", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 10 },
  { skill: "prompt-engineering", title: "Prompt Engineering Guide", provider: "DAIR.AI", url: "https://www.promptingguide.ai/", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 8 },
  { skill: "mlops", title: "MLOps Principles", provider: "ml-ops.org", url: "https://ml-ops.org/content/mlops-principles", type: "DOCUMENTATION", difficulty: "ADVANCED", estimateHrs: 10 },

  { skill: "data-analysis", title: "Data Analysis with Python", provider: "freeCodeCamp", url: "https://www.freecodecamp.org/learn/data-analysis-with-python/", type: "COURSE", difficulty: "BEGINNER", estimateHrs: 30 },
  { skill: "pandas", title: "pandas Getting Started", provider: "pandas", url: "https://pandas.pydata.org/docs/getting_started/index.html", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 10 },
  { skill: "numpy", title: "NumPy Absolute Beginners Guide", provider: "NumPy", url: "https://numpy.org/doc/stable/user/absolute_beginners.html", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 6 },
  { skill: "data-visualization", title: "Matplotlib Tutorials", provider: "Matplotlib", url: "https://matplotlib.org/stable/tutorials/index.html", type: "TUTORIAL", difficulty: "BEGINNER", estimateHrs: 8 },
  { skill: "excel", title: "Excel Help & Learning", provider: "Microsoft", url: "https://support.microsoft.com/en-us/excel", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 10 },
  { skill: "power-bi", title: "Power BI Documentation", provider: "Microsoft Learn", url: "https://learn.microsoft.com/en-us/power-bi/", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 14 },
  { skill: "tableau", title: "Tableau Free Training Videos", provider: "Tableau", url: "https://www.tableau.com/learn/training/20251", type: "VIDEO", difficulty: "BEGINNER", estimateHrs: 12 },
  { skill: "statistics", title: "Statistics and Probability", provider: "Khan Academy", url: "https://www.khanacademy.org/math/statistics-probability", type: "COURSE", difficulty: "BEGINNER", estimateHrs: 30 },
  { skill: "etl", title: "dbt Documentation", provider: "dbt Labs", url: "https://docs.getdbt.com/docs/introduction", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 12 },
  { skill: "spark", title: "Apache Spark Documentation", provider: "Apache Software Foundation", url: "https://spark.apache.org/docs/latest/", type: "DOCUMENTATION", difficulty: "ADVANCED", estimateHrs: 16 },

  { skill: "network-security", title: "Cloudflare Learning Center", provider: "Cloudflare", url: "https://www.cloudflare.com/learning/", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 10 },
  { skill: "application-security", title: "OWASP Top 10", provider: "OWASP", url: "https://owasp.org/www-project-top-ten/", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 8 },
  { skill: "application-security", title: "OWASP Cheat Sheet Series", provider: "OWASP", url: "https://cheatsheetseries.owasp.org/", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 12 },
  { skill: "penetration-testing", title: "Web Security Academy", provider: "PortSwigger", url: "https://portswigger.net/web-security", type: "PRACTICE", difficulty: "INTERMEDIATE", estimateHrs: 40 },
  { skill: "siem", title: "Elastic Security Documentation", provider: "Elastic", url: "https://www.elastic.co/guide/en/security/current/index.html", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 12 },
  { skill: "incident-response", title: "Computer Security Incident Handling Guide", provider: "NIST", url: "https://csrc.nist.gov/pubs/sp/800/61/r2/final", type: "BOOK", difficulty: "INTERMEDIATE", estimateHrs: 8 },
  { skill: "cryptography", title: "The Cryptopals Crypto Challenges", provider: "Cryptopals", url: "https://cryptopals.com/", type: "PRACTICE", difficulty: "ADVANCED", estimateHrs: 40 },
  { skill: "iam", title: "AWS IAM User Guide", provider: "Amazon Web Services", url: "https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 10 },

  { skill: "rest-api", title: "HTTP Guide", provider: "MDN Web Docs", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 10 },
  { skill: "graphql", title: "Learn GraphQL", provider: "GraphQL Foundation", url: "https://graphql.org/learn/", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 8 },
  { skill: "testing", title: "Testing Library Documentation", provider: "Testing Library", url: "https://testing-library.com/docs/", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 8 },
  { skill: "testing", title: "Vitest Guide", provider: "Vitest", url: "https://vitest.dev/guide/", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 6 },
  { skill: "system-design", title: "The System Design Primer", provider: "Open Source", url: "https://github.com/donnemartin/system-design-primer", type: "DOCUMENTATION", difficulty: "ADVANCED", estimateHrs: 30 },
  { skill: "html-css", title: "Learn Web Development", provider: "MDN Web Docs", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development", type: "COURSE", difficulty: "BEGINNER", estimateHrs: 30 },
  { skill: "web-performance", title: "Learn Performance", provider: "web.dev", url: "https://web.dev/learn/performance", type: "COURSE", difficulty: "INTERMEDIATE", estimateHrs: 10 },
  { skill: "accessibility", title: "WAI Web Accessibility Tutorials", provider: "W3C", url: "https://www.w3.org/WAI/tutorials/", type: "TUTORIAL", difficulty: "BEGINNER", estimateHrs: 8 },
  { skill: "figma", title: "Figma Learn", provider: "Figma", url: "https://help.figma.com/hc/en-us/categories/360002051613-Get-started", type: "TUTORIAL", difficulty: "BEGINNER", estimateHrs: 8 },
  { skill: "ux-research", title: "Nielsen Norman Group Articles", provider: "Nielsen Norman Group", url: "https://www.nngroup.com/articles/", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 12 },
  { skill: "ui-design", title: "Material Design Guidelines", provider: "Google", url: "https://m3.material.io/foundations", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 10 },
  { skill: "postman", title: "OpenAPI Specification", provider: "OpenAPI Initiative", url: "https://swagger.io/specification/", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 6 },
  { skill: "seo", title: "SEO Starter Guide", provider: "Google Search Central", url: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 5 },

  { skill: "problem-solving", title: "LeetCode Explore", provider: "LeetCode", url: "https://leetcode.com/explore/", type: "PRACTICE", difficulty: "INTERMEDIATE", estimateHrs: 40 },
  { skill: "problem-solving", title: "Structured Practice Roadmap", provider: "NeetCode", url: "https://neetcode.io/roadmap", type: "PRACTICE", difficulty: "INTERMEDIATE", estimateHrs: 40 },
  { skill: "written-communication", title: "Technical Writing Courses", provider: "Google", url: "https://developers.google.com/tech-writing", type: "COURSE", difficulty: "BEGINNER", estimateHrs: 8 },
  { skill: "presentation", title: "Storytelling with Data Blog", provider: "Storytelling with Data", url: "https://www.storytellingwithdata.com/blog", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 6 },
  { skill: "project-management", title: "Agile Project Management Guide", provider: "Atlassian", url: "https://www.atlassian.com/agile/project-management", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 6 },
  { skill: "collaboration", title: "Atlassian Team Playbook", provider: "Atlassian", url: "https://www.atlassian.com/team-playbook", type: "PRACTICE", difficulty: "BEGINNER", estimateHrs: 5 },
  { skill: "stakeholder-management", title: "Agile Coach Guides", provider: "Atlassian", url: "https://www.atlassian.com/agile/agile-coach", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 6 },
  { skill: "product-strategy", title: "Product Management Guide", provider: "Atlassian", url: "https://www.atlassian.com/agile/product-management", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 8 },
  { skill: "business-analysis", title: "Business Analysis Techniques", provider: "Atlassian", url: "https://www.atlassian.com/agile/product-management/requirements", type: "DOCUMENTATION", difficulty: "BEGINNER", estimateHrs: 6 },
  { skill: "critical-thinking", title: "Decision Making Frameworks", provider: "Atlassian", url: "https://www.atlassian.com/team-playbook/plays/decision-making", type: "PRACTICE", difficulty: "BEGINNER", estimateHrs: 4 },
  { skill: "mentoring", title: "Engineering Mentorship Practices", provider: "Atlassian", url: "https://www.atlassian.com/team-playbook/plays/coaching", type: "PRACTICE", difficulty: "INTERMEDIATE", estimateHrs: 4 },
  { skill: "team-leadership", title: "Leading Distributed Teams", provider: "Atlassian", url: "https://www.atlassian.com/team-playbook/examples/distributed-teams", type: "DOCUMENTATION", difficulty: "INTERMEDIATE", estimateHrs: 5 },
  { skill: "adaptability", title: "Retrospective Practices", provider: "Atlassian", url: "https://www.atlassian.com/team-playbook/plays/retrospective", type: "PRACTICE", difficulty: "BEGINNER", estimateHrs: 3 },
  { skill: "time-management", title: "Prioritisation Techniques", provider: "Atlassian", url: "https://www.atlassian.com/team-playbook/plays/prioritization-matrix", type: "PRACTICE", difficulty: "BEGINNER", estimateHrs: 3 },
];
