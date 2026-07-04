# Blue & White Theme Implementation Guide

## Color Palette
```
Primary Blue: #0052CC
Light Blue Gradient: linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%)
White: #ffffff
Light Blue BG: #f0f5ff
Text Dark: #1e293b
Text Light: #64748b
Border: #e2e8f0
```

## How to Apply Theme

### 1. Import Theme CSS in Your Page Component
```javascript
import '../styles/BlueWhiteTheme.css'
```

### 2. Main Page Container
```javascript
<div className="theme-blue-white">
  {/* Your content */}
</div>
```

OR use inline style:
```javascript
<div style={{background: 'linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%)', minHeight: '100vh'}}>
```

### 3. Cards
```javascript
<div className="card-blue-white">
  {/* Card content */}
</div>
```

### 4. Headers/Titles
```javascript
<h1 style={{color: '#0052CC', fontWeight: '700'}}>Page Title</h1>
<p style={{color: '#64748b'}}>Subtitle or description</p>
```

### 5. Tables
```javascript
<tr style={{background: '#f0f5ff'}} className="table-header-blue-white">
  <th style={{color: '#0052CC', fontWeight: '700'}}>Column 1</th>
  <th style={{color: '#0052CC', fontWeight: '700'}}>Column 2</th>
</tr>

<tr className="table-row-blue-white" onMouseEnter={(e) => e.currentTarget.style.background = '#f0f5ff'}>
  {/* Row content */}
</tr>
```

### 6. Buttons
```javascript
<button
  style={{background: '#0052CC', color: 'white'}}
  onMouseEnter={(e) => e.target.style.opacity = '0.85'}
  onMouseLeave={(e) => e.target.style.opacity = '1'}
>
  Button Text
</button>
```

### 7. Summary/Status Cards
```javascript
<div style={{borderLeftColor: '#0052CC'}} className="status-card-blue-white">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>
```

### 8. Badges/Pills
```javascript
<span className="badge-blue">Active</span>
<span className="badge-light-blue">Pending</span>
```

## Pages Already Updated
- ✅ ExpenseApprovalsPage.jsx
- ✅ PendingApprovalsPage.jsx

## Pages to Update (Priority Order)

### High Priority (Core Financial Pages)
- [ ] Finance.jsx
- [ ] FinanceDashboard.jsx
- [ ] Invoices.jsx
- [ ] TransactionList.jsx
- [ ] Projects.jsx
- [ ] Staff.jsx

### Medium Priority
- [ ] Purchases.jsx
- [ ] Sales.jsx
- [ ] Materials.jsx
- [ ] Vehicles.jsx
- [ ] AdminDashboard.jsx
- [ ] ProjectDetails.jsx

### Standard (Can be updated later)
- [ ] All other pages

## CSS Classes Available
- `.theme-blue-white` - Main background
- `.card-blue-white` - Card styling
- `.header-blue-white` - Header styling
- `.btn-blue-white` - Button styling
- `.table-header-blue-white` - Table header
- `.table-row-blue-white` - Table row hover
- `.input-blue-white` - Input focus styling
- `.badge-blue` - Blue badge
- `.badge-light-blue` - Light blue badge
- `.status-card-blue-white` - Status card
- `.link-blue-white` - Link styling
- `.tab-blue-white` - Tab styling
- `.avatar-blue` - Avatar background
- `.grid-blue-white` - Grid container
- `.animate-slide-in` - Slide animation

## Quick Reference for Common Updates

### Page Background
```javascript
style={{background: 'linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%)', minHeight: '100vh'}}
```

### Header Text
```javascript
style={{color: '#0052CC'}}
```

### Summary Cards Border
```javascript
style={{borderLeftColor: '#0052CC'}}
```

### Button Styling
```javascript
style={{background: '#0052CC', color: 'white'}}
```

### Table Header Background
```javascript
style={{background: '#f0f5ff'}}
```

### Text Colors
- Headers: `#1e293b`
- Body: `#64748b`
- Primary: `#0052CC`
- Error: `#dc2626`

### Hover Effects
```javascript
onMouseEnter={(e) => e.target.style.background = '#f0f5ff'}
onMouseLeave={(e) => e.target.style.background = 'white'}
```
