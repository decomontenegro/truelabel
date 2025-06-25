# 🎨 True Label - Design Test Guide

## Quick Start

```bash
# Option 1: Automatic Web Test (recommended)
./test-web-design.sh

# Option 2: Interactive Menu
./START-WEB-TEST.sh

# Option 3: Manual Start
npm run dev
# Then open: http://localhost:5001
```

## New Ports Configuration
- **Frontend**: http://localhost:5001 (changed from 3001)
- **Backend**: http://localhost:5000 (changed from 3000)

## Design Test Pages

### 1. Design Showcase (Complete UI Kit)
http://localhost:5001/design-showcase

This page displays ALL UI components:
- Color palette
- Typography system
- All button variants
- Form elements
- Cards and alerts
- Loading states
- Toast notifications
- Tables
- Icons

### 2. Main Application Pages

#### Public Pages (No Login Required)
- **Landing Page**: http://localhost:5001/
- **About**: http://localhost:5001/about
- **How It Works**: http://localhost:5001/how-it-works
- **Pricing**: http://localhost:5001/pricing
- **Contact**: http://localhost:5001/contact

#### Authentication Pages
- **Login**: http://localhost:5001/auth/login
- **Register**: http://localhost:5001/auth/register

#### Dashboard Pages (Login Required)
- **Dashboard**: http://localhost:5001/dashboard
- **Products**: http://localhost:5001/products
- **Validations**: http://localhost:5001/validations
- **Analytics**: http://localhost:5001/analytics
- **Privacy**: http://localhost:5001/privacy

## Design Elements to Check

### 1. Responsive Design
- Resize browser window to test mobile/tablet/desktop views
- Check navigation menu collapse on mobile
- Verify card layouts stack properly
- Test form inputs on mobile

### 2. Color Consistency
- Primary blue (#2563eb)
- Success green (#16a34a)
- Warning yellow (#eab308)
- Danger red (#dc2626)
- Gray scale consistency

### 3. Interactive Elements
- Button hover states
- Form validation messages
- Loading spinners
- Toast notifications (click buttons in Design Showcase)
- Modal dialogs
- Dropdown menus

### 4. Typography
- Heading hierarchy (H1-H4)
- Body text readability
- Link styles
- Font weights consistency

### 5. Components
- Cards with hover effects
- Tables with row hover
- Form inputs with focus states
- Badges and status indicators
- Navigation active states

## Test Credentials

```
Admin:      admin@truelabel.com / admin123
Brand:      marca@exemplo.com / marca123
Laboratory: analista@labexemplo.com / lab123
Validator:  validador@truelabel.com / validator123
```

## Quick Visual Tests

1. **Test Notifications**:
   - Go to Design Showcase
   - Click different toast buttons
   - Verify positioning and animations

2. **Test Forms**:
   - Go to Login page
   - Test validation (empty submit)
   - Check error states

3. **Test Loading**:
   - Login with credentials
   - Navigate between pages
   - Check loading transitions

4. **Test Dark Mode** (if implemented):
   - Look for theme toggle
   - Verify all components adapt

5. **Test QR Code**:
   - Login as Brand
   - Go to Products
   - Generate a QR code
   - Test scanning page

## Browser Testing

Test in multiple browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (macOS)
- Edge (Windows)
- Mobile browsers

## Performance Checks

1. Page load times (<3s)
2. Smooth animations
3. No layout shifts
4. Responsive interactions

## Accessibility

- Tab navigation works
- Focus indicators visible
- Color contrast adequate
- Screen reader friendly

---

**Need Help?**
- Check console for errors: F12 → Console
- Backend logs: `tail -f server/logs/app.log`
- Frontend logs: Browser DevTools