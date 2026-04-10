// Classes & Prototypes
// Module 16 of 22

export const module216 = {
  id: 216,
  emoji: '🏛️',
  title: 'Classes & Prototypes',
  tagline: 'Blueprints for objects.',
  difficulty: 'advanced',
  lessons: [
    {
      id: 'j16-1',
      title: 'Classes & Inheritance',
      difficulty: 'intermediate',
      duration: '14 min',
      prereqs: ['j15-1'],
      concepts: [
        'Classes are blueprints for creating objects with shared structure.',
        'constructor() runs when you create a new instance with new.',
        'Methods defined in the class are shared across all instances.',
        'extends creates a subclass that inherits from a parent.',
        'super() calls the parent constructor.',
        'Under the hood, classes use prototypes — they\'re syntactic sugar.'
      ],
      code: `class User {
    constructor(name, email) {
        this.name = name;
        this.email = email;
    }

    greet() {
        return \`Hi, I'm \${this.name}\`;
    }
}

class Admin extends User {
    constructor(name, email, level) {
        super(name, email);
        this.level = level;
    }

    promote() {
        this.level++;
        return \`\${this.name} is now level \${this.level}\`;
    }
}

const admin = new Admin("Jenna", "j@code.com", 1);
console.log(admin.greet());   // "Hi, I'm Jenna"
console.log(admin.promote()); // "Jenna is now level 2"`,
      output: 'A User class and an Admin subclass with inherited and custom methods.',
      tasks: [
        'Create a class with a constructor and 2 methods.',
        'Create a subclass that extends the parent.',
        'Instantiate both classes and call their methods.'
      ],
      challenge: 'Build a Vehicle class, then extend it into Car and Truck subclasses with unique methods.',
      devFession: 'I forgot super() in a subclass constructor. JavaScript yelled "Must call super constructor before accessing this."'
    }
  ]
};
