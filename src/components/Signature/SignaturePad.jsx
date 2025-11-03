// src/components/Signature/SignaturePad.jsx

import React, { useRef, useState, useEffect } from 'react';
import {
  Pen,
  Eraser,
  RotateCcw,
  Check,
  X,
  Download,
  Upload,
  AlertCircle
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

/**
 * Pad de signature électronique
 * - Dessin au doigt ou stylet
 * - Sauvegarde en image
 * - Validation et historique
 * - Support responsive
 */
const SignaturePad = ({
  onSave,
  onCancel,
  requiredFields = {},
  intervention,
  user,
  className = ''
}) => {
  const sigPadRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [penColor, setPenColor] = useState('#000000');
  const [penWidth, setPenWidth] = useState(2);
  const [showValidation, setShowValidation] = useState(false);
  const [formData, setFormData] = useState({
    signerName: user?.name || '',
    signerRole: user?.role || 'technician',
    signerEmail: user?.email || '',
    comments: '',
    acceptTerms: false
  });

  // Détecter si le canvas a du contenu
  const checkIfEmpty = () => {
    if (sigPadRef.current) {
      setIsEmpty(sigPadRef.current.isEmpty());
    }
  };

  // Effacer la signature
  const handleClear = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
      setIsEmpty(true);
    }
  };

  // Annuler l'action
  const handleUndo = () => {
    if (sigPadRef.current) {
      const data = sigPadRef.current.toData();
      if (data.length > 0) {
        data.pop();
        sigPadRef.current.fromData(data);
        checkIfEmpty();
      }
    }
  };

  // Télécharger la signature en PNG
  const handleDownload = () => {
    if (sigPadRef.current && !isEmpty) {
      const dataUrl = sigPadRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `signature-${Date.now()}.png`;
      link.click();
    }
  };

  // Valider et sauvegarder
  const handleValidate = async () => {
    if (isEmpty) {
      alert('Veuillez signer avant de valider');
      return;
    }

    if (!formData.acceptTerms) {
      alert('Vous devez accepter les conditions');
      return;
    }

    setShowValidation(true);
  };

  // Sauvegarder la signature
  const handleSave = async () => {
    if (sigPadRef.current && !isEmpty) {
      const dataUrl = sigPadRef.current.toDataURL('image/png');
      
      const signatureData = {
        imageUrl: dataUrl,
        signedBy: user.uid,
        signedByName: formData.signerName,
        signedAt: new Date(),
        role: formData.signerRole,
        email: formData.signerEmail,
        comments: formData.comments,
        interventionId: intervention?.id,
        ipAddress: await getIPAddress(),
        userAgent: navigator.userAgent
      };

      onSave?.(signatureData);
    }
  };

  // Obtenir l'IP (pour audit)
  const getIPAddress = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'Unknown';
    }
  };

  // Ajuster la taille du canvas au redimensionnement
  useEffect(() => {
    const handleResize = () => {
      if (sigPadRef.current) {
        const canvas = sigPadRef.current.getCanvas();
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext('2d').scale(ratio, ratio);
        sigPadRef.current.clear();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (showValidation) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 ${className}`}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Confirmer la signature
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Veuillez vérifier les informations avant de valider définitivement
          </p>
        </div>

        {/* Prévisualisation de la signature */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Signature
          </h4>
          <div className="bg-white dark:bg-gray-600 border-2 border-gray-300 dark:border-gray-500 rounded-lg p-4">
            <img
              src={sigPadRef.current?.toDataURL()}
              alt="Signature"
              className="max-h-32 mx-auto"
            />
          </div>
        </div>

        {/* Informations du signataire */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Informations du signataire
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Nom :</span>
              <p className="font-medium text-gray-900 dark:text-white">
                {formData.signerName}
              </p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Rôle :</span>
              <p className="font-medium text-gray-900 dark:text-white">
                {formData.signerRole === 'technician' ? 'Technicien' :
                 formData.signerRole === 'manager' ? 'Manager' :
                 formData.signerRole === 'client' ? 'Client' : formData.signerRole}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600 dark:text-gray-400">Email :</span>
              <p className="font-medium text-gray-900 dark:text-white">
                {formData.signerEmail}
              </p>
            </div>
            {formData.comments && (
              <div className="col-span-2">
                <span className="text-gray-600 dark:text-gray-400">Commentaires :</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formData.comments}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Informations d'intervention */}
        {intervention && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Intervention concernée
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {intervention.missionSummary}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Chambre(s) : {intervention.rooms?.join(', ')}
            </p>
          </div>
        )}

        {/* Avertissement légal */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">Important</p>
              <p>
                En signant, vous confirmez que les travaux ont été réalisés conformément 
                aux attentes. Cette signature a valeur d'engagement.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowValidation(false)}
            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <X size={20} />
            Modifier
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Check size={20} />
            Valider définitivement
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden ${className}`}>
      {/* En-tête */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4">
        <h3 className="text-xl font-bold mb-1">Signature électronique</h3>
        <p className="text-sm text-indigo-100">
          Signez avec votre doigt ou votre stylet
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Informations du signataire */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nom complet *
            </label>
            <input
              type="text"
              value={formData.signerName}
              onChange={(e) => setFormData({ ...formData, signerName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rôle *
            </label>
            <select
              value={formData.signerRole}
              onChange={(e) => setFormData({ ...formData, signerRole: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="technician">Technicien</option>
              <option value="manager">Manager</option>
              <option value="client">Client</option>
              <option value="reception">Réception</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.signerEmail}
              onChange={(e) => setFormData({ ...formData, signerEmail: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Commentaires
            </label>
            <textarea
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="Remarques ou observations..."
            />
          </div>
        </div>

        {/* Barre d'outils */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Couleur :
            </label>
            <div className="flex gap-2">
              {['#000000', '#1E40AF', '#DC2626', '#059669'].map(color => (
                <button
                  key={color}
                  onClick={() => setPenColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    penColor === color
                      ? 'border-indigo-500 scale-110'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Épaisseur :
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={penWidth}
              onChange={(e) => setPenWidth(parseInt(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
              {penWidth}px
            </span>
          </div>
        </div>

        {/* Canvas de signature */}
        <div className="relative">
          <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700">
            <SignatureCanvas
              ref={sigPadRef}
              canvasProps={{
                className: 'w-full h-64 cursor-crosshair touch-none'
              }}
              penColor={penColor}
              minWidth={penWidth * 0.5}
              maxWidth={penWidth * 1.5}
              onEnd={checkIfEmpty}
            />
          </div>
          
          {/* Watermark */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-400 pointer-events-none">
            Signez ici
          </div>
        </div>

        {/* Actions sur la signature */}
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            disabled={isEmpty}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            Annuler
          </button>
          
          <button
            onClick={handleClear}
            disabled={isEmpty}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Eraser size={18} />
            Effacer
          </button>
          
          <button
            onClick={handleDownload}
            disabled={isEmpty}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Télécharger
          </button>
        </div>

        {/* Conditions */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Je certifie que les informations fournies sont exactes et que cette signature 
              engage ma responsabilité concernant les travaux effectués. *
            </span>
          </label>
        </div>

        {/* Actions finales */}
        <div className="flex gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <X size={20} />
            Annuler
          </button>
          <button
            onClick={handleValidate}
            disabled={isEmpty || !formData.signerName || !formData.acceptTerms}
            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            <Check size={20} />
            Valider la signature
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignaturePad;