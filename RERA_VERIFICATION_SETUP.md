# RERA Verification Setup Guide

## Current Status
The system has **TWO MODES** based on whether Surepass API is configured:

### WITHOUT Surepass API (Current Default):
- ✅ Validates RERA ID format
- ✅ Creates account with **PENDING status** (not verified)
- ✅ Requires **manual admin review** before account activation
- ⚠️ User notified their account is pending verification
- ❌ Does NOT verify if RERA ID is registered in government database

### WITH Surepass API (If API key configured):
- ✅ Validates RERA ID format
- ✅ **Real-time verification** against government database
- ✅ Creates **ACTIVE account** only if RERA ID is verified
- ❌ **REJECTS signup** if RERA ID not found in database
- 🔒 **No fake RERA IDs** can create verified accounts

## Why No Real Verification?

Gujarat RERA (https://gujrera.gujarat.gov.in/) **does not provide a public API** for automated verification. The official website only offers a manual search interface.

## Solution Options

### Option 1: Manual Admin Review (Current - FREE)
Vendor/Broker accounts require admin approval after format validation.

**How it works:**
1. User enters RERA ID
2. System validates the format (shows "Format OK")
3. Account created with **PENDING status**
4. User notified: "Account pending admin review"
5. Admin manually verifies RERA ID on Gujarat RERA website
6. Admin approves/rejects the account
7. User receives email notification of approval/rejection

**Security:**
- ✅ Prevents fake RERA IDs from creating active accounts
- ✅ Manual verification by admin before activation
- ⚠️ Requires admin intervention for each vendor/broker signup

### Option 2: Automated Verification with Surepass API (Recommended for Production)

**Surepass** provides a commercial RERA verification API that connects directly to government databases.

#### Setup Steps:

1. **Get API Key from Surepass**
   - Visit: https://surepass.io/rera-verification-api/
   - Sign up for an account
   - Contact sales for pricing (custom pricing based on usage)
   - Get your API key

2. **Add API Key to Environment Variables**
   ```bash
   # In Replit Secrets or .env file
   SUREPASS_API_KEY=your_api_key_here
   ```

3. **Restart the Application**
   - The system will automatically detect the API key
   - Real verification will be enabled

4. **How it works with API:**
   - User enters RERA ID
   - System validates format
   - System calls Surepass API to verify against government database
   - Returns "Verified" if found in database
   - Returns "Not Found" if RERA ID doesn't exist

#### Surepass API Benefits:
- ✅ Real-time verification (< 1 second)
- ✅ Direct connection to government RERA databases
- ✅ Covers all Indian states
- ✅ Returns complete project/developer details
- ✅ 24/7 uptime and support

#### Pricing:
- Contact Surepass sales team for custom pricing
- Email: [email protected]
- Typically based on API volume and business requirements

## Supported RERA ID Formats

The system validates these formats:

1. **Full Gujarat Format (7 parts):**
   ```
   PR/GJ/AHMEDABAD/AHMEDABAD CITY/AUDA/RAA07880/070121
   ```

2. **Short Gujarat Format (5 parts):**
   ```
   PR/GJ/AHMEDABAD/RAA07880/070121
   ```

3. **Simple State Code + Number:**
   ```
   MH12345678901234
   P99000052568
   ```

4. **State Format with Slashes:**
   ```
   KA/RERA/123/2020
   MH/PROJ/12345/201234
   ```

5. **Hyphenated Format:**
   ```
   TN-RERA-12345-2020
   ```

## Testing

### Without Surepass API (Current):
1. Enter a correctly formatted RERA ID
2. System shows "Format OK"
3. Link to Gujarat RERA website appears for manual verification
4. Click "Create Account"
5. **Account created with PENDING status**
6. Message: "Account pending admin review"
7. Cannot sign in until admin approves

### With Surepass API (After Setup):
1. Enter any RERA ID
2. System validates format
3. System calls Surepass API
4. **If found in database:**
   - Shows "Verified"
   - Account created with ACTIVE status
   - Can sign in immediately
5. **If NOT found in database:**
   - Signup REJECTED
   - Error: "RERA ID not found in government database"
   - Account NOT created

## Recommendations

**For Development/Testing:**
- Use format-only validation (current setup)
- Manually verify RERA IDs on official website

**For Production:**
- Set up Surepass API for automated verification
- Provides better user experience
- Reduces fraud and fake registrations
- Builds trust with real verification
