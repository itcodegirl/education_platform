export const module = { id: 9, emoji: '📊', title: 'Tables', tagline: 'Organize data, not layouts.', difficulty: 'intermediate', lessons: [
    { id: 'h9-1', title: 'Building Data Tables',
      prereqs: ['h8-1'],
      difficulty: 'beginner', duration: '12 min',
      concepts: [
        'Tables are for DATA only — never use them for page layout.',
        '<table> wraps the whole thing, <thead> and <tbody> separate headers from data.',
        '<tr> creates a row, <th> creates a header cell, <td> creates a data cell.',
        'colspan and rowspan let cells span multiple columns or rows.',
      ],
      code: `<table>\n    <thead>\n        <tr>\n            <th>Name</th>\n            <th>Role</th>\n            <th>Status</th>\n        </tr>\n    </thead>\n    <tbody>\n        <tr>\n            <td>Jenna</td>\n            <td>Developer</td>\n            <td>Active</td>\n        </tr>\n        <tr>\n            <td>Alex</td>\n            <td>Designer</td>\n            <td>Active</td>\n        </tr>\n    </tbody>\n</table>`,
      output: 'A structured data table with headers and two rows of data.',
      tasks: [
        'Build a table with at least 3 columns and 3 rows.',
        'Add <thead> and <tbody> sections.',
        'Use colspan to make a cell span two columns.',
      ],
      challenge: 'Create a class schedule table with days as columns and time slots as rows.',
      devFession: 'I built an entire page layout using tables. It was 2024. There is no excuse.' },
  ]};
