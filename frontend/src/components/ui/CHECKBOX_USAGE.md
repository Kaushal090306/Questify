# BrutalistCheckbox Usage Guide

## Import the Component

```javascript
// Option 1: Direct import
import BrutalistCheckbox from '../ui/BrutalistCheckbox';

// Option 2: From index file
import { BrutalistCheckbox } from '../ui';
```

## Basic Usage

```javascript
import React, { useState } from 'react';
import { BrutalistCheckbox } from '../ui';

const MyComponent = () => {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div>
      <BrutalistCheckbox
        checked={isChecked}
        onChange={() => setIsChecked(!isChecked)}
      />
      <label>Accept Terms</label>
    </div>
  );
};
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | boolean | false | Controls whether the checkbox is checked |
| `onChange` | function | - | Callback function when checkbox state changes |
| `disabled` | boolean | false | Disables the checkbox |
| `name` | string | - | Name attribute for form submission |
| `value` | string | - | Value attribute for form submission |

## Usage Examples

### 1. Form Settings
```javascript
const [settings, setSettings] = useState({
  notifications: true,
  darkMode: false,
  autoSave: true
});

const updateSetting = (key) => {
  setSettings(prev => ({
    ...prev,
    [key]: !prev[key]
  }));
};

return (
  <div>
    <BrutalistCheckbox
      checked={settings.notifications}
      onChange={() => updateSetting('notifications')}
    />
    <label>Enable Notifications</label>
  </div>
);
```

### 2. Todo List
```javascript
const [todos, setTodos] = useState([
  { id: 1, text: 'Task 1', completed: false },
  { id: 2, text: 'Task 2', completed: true }
]);

const toggleTodo = (id) => {
  setTodos(prev => 
    prev.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
  );
};

return (
  <div>
    {todos.map(todo => (
      <div key={todo.id}>
        <BrutalistCheckbox
          checked={todo.completed}
          onChange={() => toggleTodo(todo.id)}
        />
        <span>{todo.text}</span>
      </div>
    ))}
  </div>
);
```

### 3. Quiz Questions
```javascript
const [selectedAnswers, setSelectedAnswers] = useState([]);

const toggleAnswer = (answer) => {
  setSelectedAnswers(prev => 
    prev.includes(answer)
      ? prev.filter(a => a !== answer)
      : [...prev, answer]
  );
};

return (
  <div>
    {options.map(option => (
      <div key={option}>
        <BrutalistCheckbox
          checked={selectedAnswers.includes(option)}
          onChange={() => toggleAnswer(option)}
        />
        <label>{option}</label>
      </div>
    ))}
  </div>
);
```

### 4. Filter Options
```javascript
const [filters, setFilters] = useState({
  category1: false,
  category2: true,
  category3: false
});

return (
  <div>
    {Object.entries(filters).map(([key, checked]) => (
      <div key={key}>
        <BrutalistCheckbox
          checked={checked}
          onChange={() => setFilters(prev => ({
            ...prev,
            [key]: !prev[key]
          }))}
        />
        <label>{key}</label>
      </div>
    ))}
  </div>
);
```

## Styling

The checkbox comes with built-in brutalist styling:
- White border (5px solid)
- White fill when checked
- Smooth scale animation (0.1s ease)
- 2em x 2em size

## Integration in Your Pages

### Quiz Pages
- Use for multiple choice questions
- Use for quiz settings (timer, difficulty)
- Use for answer selection

### Settings Pages  
- Use for user preferences
- Use for notification settings
- Use for privacy options

### Forms
- Use for terms acceptance
- Use for newsletter subscriptions
- Use for optional fields

### Dashboard
- Use for filter controls
- Use for view options
- Use for quick actions

## Best Practices

1. **Always provide labels** for accessibility
2. **Use controlled components** with state management
3. **Group related checkboxes** visually
4. **Provide clear feedback** when states change
5. **Consider form validation** for required checkboxes

## Accessibility

The checkbox includes:
- Proper cursor pointer
- Hidden native input for screen readers
- Keyboard navigation support
- Visual focus indicators
