'use client';

import { useState } from 'react';
import SafeDisplay from '@/components/ui/SafeDisplay';
import SecureForm from '@/components/ui/SecureForm';
import { commonSchemas } from '@/utils/validation';
import Card from '@/components/ui/Card';

export default function SecurityDemoPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSecurityTest = async (data: Record<string, any>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/security/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testInput: data.testInput }),
      });

      const result = await response.json();
      setTestResults(result);
    } catch (error) {
      console.error('Security test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenCreation = async (data: Record<string, any>) => {
    try {
      const response = await fetch('/api/tokens/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          departmentId: 'demo-dept-id', // This would be selected from a dropdown in real app
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('Token created successfully! Check console for details.');
        console.log('Token created:', result);
      } else {
        alert(`Error: ${result.error}`);
        console.error('Token creation error:', result);
      }
    } catch (error) {
      console.error('Token creation error:', error);
      alert('An error occurred while creating the token');
    }
  };

  const dangerousExamples = [
    '<script>alert("XSS Attack!")</script>',
    '<img src="x" onerror="alert(\'XSS\')">',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    "'; DROP TABLE users; --",
    "' OR 1=1 --",
    '<svg onload="alert(\'XSS\')">',
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Security Demo - Input Sanitization & OWASP Compliance</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Security Test Section */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">XSS & SQL Injection Prevention Test</h2>
          <p className="text-gray-600 mb-4">
            Test our input sanitization by entering potentially malicious content below.
            The system will show you the original input, sanitized version, and security analysis.
          </p>

          <SecureForm
            onSubmit={handleSecurityTest}
            schema={{
              testInput: { required: true, minLength: 1, maxLength: 1000 },
            }}
            sanitizationSchema={{
              testInput: 'text',
            }}
            fields={[
              {
                name: 'testInput',
                label: 'Test Input',
                type: 'text',
                placeholder: 'Try: <script>alert("XSS")</script> or \'; DROP TABLE users; --',
                required: true,
              },
            ]}
            submitLabel={isLoading ? 'Testing...' : 'Test Security'}
          />

          {/* Quick Test Buttons */}
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Quick Tests:</p>
            <div className="flex flex-wrap gap-2">
              {dangerousExamples.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleSecurityTest({ testInput: example })}
                  className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  disabled={isLoading}
                >
                  Test {index + 1}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Secure Form Demo */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Secure Patient Token Form</h2>
          <p className="text-gray-600 mb-4">
            This form demonstrates secure input handling with validation and sanitization.
            Try entering malicious content - it will be safely processed.
          </p>

          <SecureForm
            onSubmit={handleTokenCreation}
            schema={commonSchemas.patientToken}
            sanitizationSchema={{
              patientName: 'name',
              patientPhone: 'phone',
              patientAge: 'integer',
              visitReason: 'text',
            }}
            fields={[
              {
                name: 'patientName',
                label: 'Patient Name',
                type: 'text',
                placeholder: 'Enter patient name',
                required: true,
              },
              {
                name: 'patientPhone',
                label: 'Phone Number',
                type: 'tel',
                placeholder: '1234567890',
                required: true,
              },
              {
                name: 'patientAge',
                label: 'Age',
                type: 'number',
                placeholder: '25',
              },
              {
                name: 'visitReason',
                label: 'Visit Reason',
                type: 'text',
                placeholder: 'Reason for visit',
              },
            ]}
            submitLabel="Create Token"
          />
        </Card>
      </div>

      {/* Test Results */}
      {testResults && (
        <Card className="p-6 mt-8">
          <h2 className="text-2xl font-semibold mb-4">Security Test Results</h2>
          
          <div className="space-y-6">
            {/* User Input Results */}
            <div>
              <h3 className="text-lg font-medium mb-2">Your Input Analysis</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div>
                  <strong>Original:</strong>
                  <code className="block bg-red-50 p-2 mt-1 rounded text-sm">
                    {testResults.input.original}
                  </code>
                </div>
                <div>
                  <strong>Sanitized (Strict):</strong>
                  <code className="block bg-green-50 p-2 mt-1 rounded text-sm">
                    {testResults.input.sanitizedStrict || '(empty - all dangerous content removed)'}
                  </code>
                </div>
                <div>
                  <strong>Sanitized (Display):</strong>
                  <SafeDisplay 
                    content={testResults.input.sanitizedDisplay}
                    allowHtml={true}
                    className="bg-blue-50 p-2 mt-1 rounded text-sm"
                  />
                </div>
                <div>
                  <strong>Security Check:</strong>
                  <div className={`p-2 mt-1 rounded text-sm ${
                    testResults.input.securityCheck.isSafe ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {testResults.input.securityCheck.isSafe 
                      ? '✅ Safe - No threats detected' 
                      : `⚠️ Threats detected: ${testResults.input.securityCheck.threats.join(', ')}`
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Common Attack Examples */}
            <div>
              <h3 className="text-lg font-medium mb-2">Common Attack Prevention Examples</h3>
              <div className="space-y-3">
                {testResults.commonAttackExamples.map((attack: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm">
                      <strong>Attack #{index + 1}:</strong>
                      <code className="block bg-red-50 p-2 mt-1 rounded text-xs">
                        {attack.original}
                      </code>
                      <strong className="mt-2 block">Sanitized:</strong>
                      <code className="block bg-green-50 p-2 mt-1 rounded text-xs">
                        {attack.sanitized || '(completely removed)'}
                      </code>
                      <div className={`mt-2 text-xs ${
                        attack.securityCheck.isSafe ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {attack.securityCheck.isSafe 
                          ? '✅ Neutralized' 
                          : `⚠️ ${attack.securityCheck.threats.join(', ')} detected and blocked`
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Security Features Documentation */}
      <Card className="p-6 mt-8">
        <h2 className="text-2xl font-semibold mb-4">Implemented Security Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Input Sanitization</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• HTML tag removal and encoding</li>
              <li>• Script injection prevention</li>
              <li>• SQL injection detection</li>
              <li>• Phone number validation</li>
              <li>• Email sanitization</li>
              <li>• Name validation (letters only)</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Security Headers</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Content Security Policy (CSP)</li>
              <li>• X-Frame-Options: DENY</li>
              <li>• X-Content-Type-Options: nosniff</li>
              <li>• X-XSS-Protection</li>
              <li>• Referrer Policy</li>
              <li>• Permissions Policy</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}