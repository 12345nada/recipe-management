export const initialRecipes = [
  {
    id: "REC-2025-001",
    productId: "FP-001",
    productName: "Shawarma Box",
    type: "Finished Product",
    category: "Main Course",
    description: "Delicious shawarma with rice & salad",
    yield: 40,
    yieldUnit: "Pieces",
    status: "Approved",

    requestedBy: {
      name: "Chef Ahmed",
      role: "Head Chef",
    },

    lastUpdated: "20 May 2025",
    updatedTime: "10:30 AM",

    ingredients: [
      {
        id: 1,
        productId: "SF-001",
        name: "Pita Bread",
        type: "Semi-Finished",
        quantity: 40,
        unit: "Pieces",
      },
      {
        id: 2,
        productId: "SF-002",
        name: "Shawarma Meat",
        type: "Semi-Finished",
        quantity: 1.8,
        unit: "Kg",
      },
      {
        id: 3,
        productId: "SF-003",
        name: "Tahini Sauce",
        type: "Semi-Finished",
        quantity: 0.5,
        unit: "Kg",
      },
      {
        id: 4,
        productId: "RM-001",
        name: "Tomatoes",
        type: "Raw Material",
        quantity: 0.6,
        unit: "Kg",
      },
    ],
  },

  {
    id: "REC-2025-002",
    productId: "SF-003",
    productName: "Tahini Sauce",
    type: "Semi-Finished",
    category: "Sauces",
    description: "Smooth and creamy tahini sauce",
    yield: 1,
    yieldUnit: "Kg",
    status: "Pending Approval",

    requestedBy: {
      name: "Chef Ahmed",
      role: "Head Chef",
    },

    lastUpdated: "19 May 2025",
    updatedTime: "04:15 PM",

    ingredients: [],
  },

  {
    id: "REC-2025-003",
    productId: "SF-004",
    productName: "Pita Bread",
    type: "Semi-Finished",
    category: "Bakery",
    description: "Soft and fresh pita bread",
    yield: 100,
    yieldUnit: "Pieces",
    status: "Approved",

    requestedBy: {
      name: "Chef Ahmed",
      role: "Head Chef",
    },

    lastUpdated: "19 May 2025",
    updatedTime: "11:25 AM",

    ingredients: [],
  },

  {
    id: "REC-2025-004",
    productId: "SF-005",
    productName: "Garlic Sauce",
    type: "Semi-Finished",
    category: "Sauces",
    description: "Traditional garlic sauce",
    yield: 1,
    yieldUnit: "Kg",
    status: "Rejected",

    requestedBy: {
      name: "Approver Sara",
      role: "Approver",
    },

    lastUpdated: "18 May 2025",
    updatedTime: "08:45 AM",

    ingredients: [],
  },

  {
    id: "REC-2025-005",
    productId: "FP-002",
    productName: "Chicken Box",
    type: "Finished Product",
    category: "Main Course",
    description: "Grilled chicken with rice & fries",
    yield: 40,
    yieldUnit: "Pieces",
    status: "ERP Pending",

    requestedBy: {
      name: "Approver Sara",
      role: "Approver",
    },

    lastUpdated: "18 May 2025",
    updatedTime: "09:10 AM",

    ingredients: [],
  },

  {
    id: "REC-2025-006",
    productId: "RM-003",
    productName: "Pickles",
    type: "Raw Material",
    category: "Ingredients",
    description: "Mixed pickles",
    yield: 5,
    yieldUnit: "Kg",
    status: "ERP Completed",

    requestedBy: {
      name: "ERP User Omar",
      role: "ERP Data Entry",
    },

    lastUpdated: "17 May 2025",
    updatedTime: "02:30 PM",

    ingredients: [],
  },

  {
    id: "REC-2025-007",
    productId: "RM-004",
    productName: "Tomatoes",
    type: "Raw Material",
    category: "Ingredients",
    description: "Fresh red tomatoes",
    yield: 10,
    yieldUnit: "Kg",
    status: "Approved",

    requestedBy: {
      name: "Chef Ahmed",
      role: "Head Chef",
    },

    lastUpdated: "17 May 2025",
    updatedTime: "11:05 AM",

    ingredients: [],
  },
];


export const productOptions = [
  {
    id: "FP-001",
    name: "Shawarma Box",
    type: "Finished Product",
    category: "Main Course",
    unit: "Pieces",
  },
  {
    id: "FP-002",
    name: "Chicken Box",
    type: "Finished Product",
    category: "Main Course",
    unit: "Pieces",
  },
  {
    id: "SF-001",
    name: "Pita Bread",
    type: "Semi-Finished",
    category: "Bakery",
    unit: "Pieces",
  },
  {
    id: "SF-002",
    name: "Shawarma Meat",
    type: "Semi-Finished",
    category: "Preparation",
    unit: "Kg",
  },
  {
    id: "SF-003",
    name: "Tahini Sauce",
    type: "Semi-Finished",
    category: "Sauces",
    unit: "Kg",
  },
  {
    id: "RM-001",
    name: "Tomatoes",
    type: "Raw Material",
    category: "Ingredients",
    unit: "Kg",
  },
  {
    id: "RM-002",
    name: "Parsley",
    type: "Raw Material",
    category: "Ingredients",
    unit: "Kg",
  },
  {
    id: "PK-001",
    name: "Box",
    type: "Packaging",
    category: "Packaging",
    unit: "Piece",
  },
  {
    id: "PK-002",
    name: "Plastic Bag",
    type: "Packaging",
    category: "Packaging",
    unit: "Piece",
  },
];