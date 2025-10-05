import { useEffect, useState } from 'react';

export default function FirebaseDebug() {
  const [config, setConfig] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const checkConfig = () => {
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      };

      setConfig(firebaseConfig);

      const newErrors: string[] = [];
      const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
      
      requiredKeys.forEach(key => {
        if (!firebaseConfig[key as keyof typeof firebaseConfig]) {
          newErrors.push(`Missing: ${key}`);
        }
      });

      // Check if values look like placeholders
      if (firebaseConfig.apiKey?.includes('your_') || firebaseConfig.apiKey?.includes('YOUR_')) {
        newErrors.push('API Key appears to be a placeholder');
      }
      if (firebaseConfig.projectId?.includes('your_') || firebaseConfig.projectId?.includes('YOUR_')) {
        newErrors.push('Project ID appears to be a placeholder');
      }

      setErrors(newErrors);
    };

    checkConfig();
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-md text-xs">
      <h3 className="font-bold mb-2">Firebase Config Debug</h3>
      
      {errors.length > 0 && (
        <div className="mb-2">
          <p className="text-red-600 font-semibold">Errors:</p>
          <ul className="text-red-600">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-1">
        <p><strong>API Key:</strong> {config?.apiKey ? `${config.apiKey.substring(0, 10)}...` : 'Missing'}</p>
        <p><strong>Project ID:</strong> {config?.projectId || 'Missing'}</p>
        <p><strong>Auth Domain:</strong> {config?.authDomain || 'Missing'}</p>
        <p><strong>App ID:</strong> {config?.appId ? `${config.appId.substring(0, 20)}...` : 'Missing'}</p>
      </div>

      {errors.length === 0 && (
        <p className="text-green-600 mt-2">✅ Config looks good!</p>
      )}
    </div>
  );
}
