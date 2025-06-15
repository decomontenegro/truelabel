# 🏷️ True Label Development Standards

## 📅 **Established**: June 15, 2025
## 🎯 **Purpose**: Prevent deployment failures and maintain code quality

---

## 🚨 **CRITICAL DEPLOYMENT RULES**

### **Rule #1: No Last-Minute Simplifications**
- ❌ **NEVER** simplify working code without proper testing
- ❌ **NEVER** remove essential components during deployment
- ✅ **ALWAYS** test simplifications in development environment first
- ✅ **ALWAYS** maintain working backups before changes

### **Rule #2: Systematic Debugging Approach**
- ❌ **AVOID** trial-and-error fixes
- ❌ **AVOID** multiple rapid changes without testing
- ✅ **FOLLOW** systematic root cause analysis
- ✅ **MAKE** incremental, tested changes
- ✅ **VALIDATE** each change before proceeding

### **Rule #3: Working State Documentation**
- ✅ **DOCUMENT** what works and why before making changes
- ✅ **MAINTAIN** detailed change logs
- ✅ **BACKUP** working configurations
- ✅ **TEST** in production-like environments

---

## 🔧 **DEPLOYMENT STANDARDS**

### **Pre-Deployment Checklist**
```bash
# 1. Verify local functionality
npm run build
npm run test

# 2. Check all routes
npm run status
./check-compliance.sh

# 3. Test API endpoints
curl http://localhost:3334/health
curl http://localhost:3334/api-info

# 4. Validate frontend build
ls -la client/dist/
```

### **Deployment Process**
1. **Create backup branch**: `git checkout -b backup-before-deploy`
2. **Test locally**: Verify all functionality
3. **Incremental deployment**: Deploy one component at a time
4. **Validate each step**: Test after each deployment
5. **Rollback plan**: Have immediate rollback strategy

### **Post-Deployment Validation**
```bash
# Test all critical endpoints
curl https://[domain]/api/health
curl https://[domain]/api/api-info
curl -X POST https://[domain]/api/auth/login -d '{"email":"admin@truelabel.com","password":"admin123"}'
```

---

## 📊 **CODE QUALITY STANDARDS**

### **API Development Rules**
1. **Always include proper error handling**
   ```javascript
   try {
     // API logic
   } catch (error) {
     console.error('Error:', error);
     res.status(500).json({ success: false, message: 'Internal server error' });
   }
   ```

2. **Maintain consistent response format**
   ```javascript
   // Success response
   { success: true, data: {...}, message: "..." }
   
   // Error response
   { success: false, message: "...", code: "..." }
   ```

3. **Include proper validation**
   ```javascript
   if (!requiredField) {
     return res.status(400).json({ success: false, message: 'field is required' });
   }
   ```

### **Frontend Development Rules**
1. **Always handle loading states**
2. **Include proper error boundaries**
3. **Validate environment variables**
4. **Test in production build mode**

---

## 🔄 **VERSION CONTROL STANDARDS**

### **Branch Strategy**
- `main`: Production-ready code only
- `develop`: Integration branch
- `feature/*`: Feature development
- `hotfix/*`: Emergency fixes
- `backup-*`: Pre-deployment backups

### **Commit Standards**
```bash
# Format: type(scope): description
feat(api): add laboratory management endpoints
fix(frontend): resolve lifecycle metrics display error
docs(standards): establish development guidelines
deploy(vercel): configure serverless function
```

### **Pre-Commit Hooks**
```bash
# Install pre-commit hooks
npm install --save-dev husky lint-staged

# Automatically run tests and linting
git commit # triggers tests automatically
```

---

## 🧪 **TESTING STANDARDS**

### **Required Tests Before Deployment**
1. **Unit Tests**: All critical functions
2. **Integration Tests**: API endpoints
3. **E2E Tests**: Critical user flows
4. **Performance Tests**: Load testing
5. **Security Tests**: Authentication flows

### **Testing Commands**
```bash
# Backend tests
cd server && npm test

# Frontend tests
cd client && npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

---

## 📈 **MONITORING STANDARDS**

### **Required Monitoring**
1. **Health Checks**: `/health` endpoint
2. **Error Tracking**: Sentry or similar
3. **Performance Monitoring**: Response times
4. **Uptime Monitoring**: External service
5. **Log Aggregation**: Centralized logging

### **Alert Thresholds**
- **Response Time**: > 2 seconds
- **Error Rate**: > 1%
- **Uptime**: < 99.9%
- **Memory Usage**: > 80%

---

## 🔒 **SECURITY STANDARDS**

### **API Security**
1. **Authentication**: JWT tokens
2. **Authorization**: Role-based access
3. **Rate Limiting**: Prevent abuse
4. **Input Validation**: Sanitize all inputs
5. **CORS**: Proper origin configuration

### **Frontend Security**
1. **Environment Variables**: Never expose secrets
2. **Content Security Policy**: Prevent XSS
3. **HTTPS Only**: Force secure connections
4. **Dependency Scanning**: Regular updates

---

## 📚 **DOCUMENTATION STANDARDS**

### **Required Documentation**
1. **API Documentation**: All endpoints
2. **Deployment Guide**: Step-by-step process
3. **Troubleshooting Guide**: Common issues
4. **Architecture Overview**: System design
5. **Development Setup**: Local environment

### **Documentation Format**
- **Markdown**: All documentation in .md files
- **Code Comments**: Explain complex logic
- **README Files**: Each major component
- **Change Logs**: Track all modifications

---

## 🎯 **LESSONS LEARNED**

### **From Vercel Deployment Experience**
1. **Serverless functions require different patterns** than Express apps
2. **Simplification can break essential functionality**
3. **Always test in target environment** before deployment
4. **Maintain working backups** at all times
5. **Document what works** before making changes

### **Best Practices Established**
1. **Incremental changes** with validation
2. **Systematic debugging** over trial-and-error
3. **Proper error handling** in all functions
4. **Consistent response formats** across API
5. **Comprehensive testing** before deployment

---

## ✅ **COMPLIANCE CHECKLIST**

Before any deployment, verify:

- [ ] All tests passing
- [ ] Documentation updated
- [ ] Backup created
- [ ] Local testing complete
- [ ] Security review done
- [ ] Performance validated
- [ ] Rollback plan ready
- [ ] Monitoring configured
- [ ] Team notified

---

**🎯 These standards are mandatory for all True Label development and deployment activities.**

**📅 Review and update quarterly or after significant incidents.**
