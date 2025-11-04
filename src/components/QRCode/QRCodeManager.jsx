// src/components/QRCode/QRCodeManager.jsx
// ✅ INTERFACE COMPLÈTE DE GESTION DES QR CODES

import React, { useState, useRef } from 'react';
import { 
  QrCode, 
  Download, 
  Camera, 
  Upload, 
  X, 
  Plus,
  Grid,
  List,
  Printer,
  FileDown,
  Zap,
  CheckCircle,
  AlertCircle,
  Home,
  Package
} from 'lucide-react';
import { qrCodeService } from '../../services/qrCodeService';
import { toast } from '../../utils/toast';

/**
 * Gestionnaire complet des QR Codes
 * - Génération pour chambres et équipements
 * - Scan via caméra ou upload
 * - Export PDF en batch
 * - Création automatique d'interventions depuis QR
 */
const QRCodeManager = ({ onClose, onCreateIntervention }) => {
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' | 'scan' | 'batch'
  const [selectedType, setSelectedType] = useState('room'); // 'room' | 'equipment' | 'intervention'
  
  // Génération
  const [roomNumber, setRoomNumber] = useState('');
  const [equipmentData, setEquipmentData] = useState({
    id: '',
    name: '',
    category: ''
  });
  const [generatedQR, setGeneratedQR] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Scan
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [scanStream, setScanStream] = useState(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // Batch
  const [batchRooms, setBatchRooms] = useState('');
  const [batchResults, setBatchResults] = useState([]);
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);

  // ========================================
  // GÉNÉRATION DE QR CODES
  // ========================================

  const handleGenerateSingle = async () => {
    setIsGenerating(true);
    
    try {
      let result;
      
      if (selectedType === 'room') {
        if (!roomNumber.trim()) {
          toast.error('Veuillez saisir un numéro de chambre');
          return;
        }
        result = await qrCodeService.generateRoomQRCode(roomNumber.trim());
      } else if (selectedType === 'equipment') {
        if (!equipmentData.name.trim()) {
          toast.error('Veuillez saisir un nom d\'équipement');
          return;
        }
        result = await qrCodeService.generateEquipmentQRCode(equipmentData);
      }

      if (result.success) {
        setGeneratedQR(result);
        toast.success('QR Code généré !');
      } else {
        toast.error('Erreur de génération', { description: result.error });
      }
    } catch (error) {
      console.error('Erreur génération QR:', error);
      toast.error('Erreur de génération');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadQR = () => {
    if (generatedQR?.downloadUrl) {
      generatedQR.downloadUrl.download();
      toast.success('QR Code téléchargé !');
    }
  };

  const handleReset = () => {
    setGeneratedQR(null);
    setRoomNumber('');
    setEquipmentData({ id: '', name: '', category: '' });
  };

  // ========================================
  // GÉNÉRATION EN BATCH
  // ========================================

  const handleGenerateBatch = async () => {
    const rooms = batchRooms
      .split(/[\n,]/)
      .map(r => r.trim())
      .filter(r => r);

    if (rooms.length === 0) {
      toast.error('Veuillez saisir au moins un numéro de chambre');
      return;
    }

    setIsGeneratingBatch(true);
    
    try {
      const items = rooms.map(roomNumber => ({ roomNumber }));
      const result = await qrCodeService.generateBatchQRCodes(items, 'room');

      if (result.success) {
        setBatchResults(result.results);
        toast.success(`${result.totalGenerated} QR Codes générés !`);
      } else {
        toast.error('Erreur de génération');
      }
    } catch (error) {
      console.error('Erreur batch:', error);
      toast.error('Erreur de génération en lot');
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  const handleDownloadBatchPDF = async () => {
    if (batchResults.length === 0) return;

    try {
      const result = await qrCodeService.generateQRCodePDF(batchResults, {
        title: 'QR Codes Chambres',
        columns: 3,
        qrSize: 80
      });

      if (result.success) {
        toast.success('PDF téléchargé !');
      } else {
        toast.error('Erreur export PDF');
      }
    } catch (error) {
      console.error('Erreur PDF:', error);
      toast.error('Erreur export PDF');
    }
  };

  const handleClearBatch = () => {
    setBatchRooms('');
    setBatchResults([]);
  };

  // ========================================
  // SCAN DE QR CODES
  // ========================================

  const handleStartCameraScan = async () => {
    setIsScanning(true);
    
    try {
      const result = await qrCodeService.scanQRCodeWithCamera(
        videoRef.current,
        (data) => handleScanSuccess(data),
        (error) => {
          console.error('Erreur scan:', error);
          toast.error('Erreur d\'accès à la caméra');
          setIsScanning(false);
        }
      );

      if (result.success) {
        setScanStream(result);
      } else {
        setIsScanning(false);
        toast.error('Impossible d\'accéder à la caméra');
      }
    } catch (error) {
      console.error('Erreur démarrage scan:', error);
      setIsScanning(false);
      toast.error('Erreur d\'accès à la caméra');
    }
  };

  const handleStopScan = () => {
    if (scanStream) {
      scanStream.stop();
      setScanStream(null);
    }
    setIsScanning(false);
    setScannedData(null);
  };

  const handleFileScan = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await qrCodeService.decodeQRCode(file);
      
      if (result.success) {
        handleScanSuccess(result.data);
      } else {
        toast.error('Aucun QR code détecté');
      }
    } catch (error) {
      console.error('Erreur scan fichier:', error);
      toast.error('Erreur de lecture du QR code');
    }
  };

  const handleScanSuccess = async (data) => {
    console.log('QR scanné:', data);
    
    // Arrêter le scan
    handleStopScan();
    
    // Traiter les données scannées
    const result = await qrCodeService.processScannedQRCode(data);
    
    if (result.success) {
      setScannedData(result);
      toast.success('QR Code scanné !');
      
      // Actions automatiques selon le type
      if (result.action === 'create_intervention') {
        // Pré-remplir le formulaire d'intervention
        if (onCreateIntervention) {
          onCreateIntervention({
            prefilledData: result.data
          });
        }
      } else if (result.action === 'view_intervention') {
        // Ouvrir l'intervention
        window.location.href = result.data.directUrl;
      }
    } else {
      toast.error('QR Code non reconnu');
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
              <QrCode size={24} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Gestion des QR Codes
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Générez, scannez et gérez vos QR codes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('generate')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'generate'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Plus size={20} className="inline mr-2" />
              Générer
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'scan'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Camera size={20} className="inline mr-2" />
              Scanner
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'batch'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Grid size={20} className="inline mr-2" />
              En lot
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB: GÉNÉRER */}
          {activeTab === 'generate' && (
            <div className="space-y-6">
              {/* Sélection du type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type de QR Code
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedType('room')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      selectedType === 'room'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-indigo-400'
                    }`}
                  >
                    <Home size={24} className="mx-auto mb-2 text-indigo-600" />
                    <div className="text-sm font-medium">Chambre</div>
                  </button>
                  <button
                    onClick={() => setSelectedType('equipment')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      selectedType === 'equipment'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-indigo-400'
                    }`}
                  >
                    <Package size={24} className="mx-auto mb-2 text-indigo-600" />
                    <div className="text-sm font-medium">Équipement</div>
                  </button>
                </div>
              </div>

              {/* Formulaire selon le type */}
              {selectedType === 'room' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Numéro de chambre
                  </label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="Ex: 705"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-lg"
                    onKeyPress={(e) => e.key === 'Enter' && handleGenerateSingle()}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nom de l'équipement
                    </label>
                    <input
                      type="text"
                      value={equipmentData.name}
                      onChange={(e) => setEquipmentData({ ...equipmentData, name: e.target.value })}
                      placeholder="Ex: Climatisation Suite 101"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Catégorie
                    </label>
                    <input
                      type="text"
                      value={equipmentData.category}
                      onChange={(e) => setEquipmentData({ ...equipmentData, category: e.target.value })}
                      placeholder="Ex: Climatisation"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Bouton de génération */}
              {!generatedQR ? (
                <button
                  onClick={handleGenerateSingle}
                  disabled={isGenerating}
                  className="w-full py-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Zap size={20} />
                      Générer le QR Code
                    </>
                  )}
                </button>
              ) : (
                <>
                  {/* QR Code généré */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 text-center border-2 border-indigo-200 dark:border-indigo-800">
                    <div className="bg-white p-4 rounded-lg inline-block mb-4">
                      <img 
                        src={generatedQR.dataUrl} 
                        alt="QR Code" 
                        className="w-64 h-64 mx-auto"
                      />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {selectedType === 'room' 
                        ? `Chambre ${generatedQR.data.roomNumber}`
                        : generatedQR.data.equipmentName
                      }
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={handleDownloadQR}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <Download size={20} />
                        Télécharger
                      </button>
                      <button
                        onClick={handleReset}
                        className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                      >
                        Nouveau
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB: SCANNER */}
          {activeTab === 'scan' && (
            <div className="space-y-6">
              {!isScanning && !scannedData ? (
                <div className="space-y-4">
                  {/* Scanner avec la caméra */}
                  <button
                    onClick={handleStartCameraScan}
                    className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                  >
                    <Camera size={48} className="mx-auto mb-3 text-indigo-600" />
                    <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Scanner avec la caméra
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Utilisez votre caméra pour scanner un QR code
                    </div>
                  </button>

                  {/* Uploader un fichier */}
                  <div className="relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileScan}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                    >
                      <Upload size={48} className="mx-auto mb-3 text-indigo-600" />
                      <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Importer une image
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Sélectionnez une image contenant un QR code
                      </div>
                    </button>
                  </div>
                </div>
              ) : isScanning ? (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-96 object-cover"
                      autoPlay
                      playsInline
                    />
                    <div className="absolute inset-0 border-4 border-indigo-500/50 m-12 rounded-lg pointer-events-none" />
                  </div>
                  <button
                    onClick={handleStopScan}
                    className="w-full py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={20} />
                    Arrêter le scan
                  </button>
                  <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                    Placez le QR code devant la caméra
                  </p>
                </div>
              ) : scannedData ? (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle size={32} className="text-green-600" />
                      <div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          QR Code scanné !
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Type: {scannedData.type}
                        </div>
                      </div>
                    </div>

                    {/* Données scannées */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2">
                      {Object.entries(scannedData.data).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    {scannedData.action === 'create_intervention' && (
                      <div className="mt-4">
                        <button
                          onClick={() => {
                            if (onCreateIntervention) {
                              onCreateIntervention({ prefilledData: scannedData.data });
                              onClose();
                            }
                          }}
                          className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                        >
                          Créer une intervention
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setScannedData(null);
                      setIsScanning(false);
                    }}
                    className="w-full py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                  >
                    Scanner un autre QR code
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB: EN LOT */}
          {activeTab === 'batch' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Numéros de chambres (un par ligne ou séparés par des virgules)
                </label>
                <textarea
                  value={batchRooms}
                  onChange={(e) => setBatchRooms(e.target.value)}
                  placeholder="101&#10;102&#10;103&#10;ou: 101, 102, 103"
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-mono text-sm"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {batchRooms.split(/[\n,]/).filter(r => r.trim()).length} chambre(s)
                </p>
              </div>

              {batchResults.length === 0 ? (
                <button
                  onClick={handleGenerateBatch}
                  disabled={isGeneratingBatch || !batchRooms.trim()}
                  className="w-full py-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGeneratingBatch ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Zap size={20} />
                      Générer tous les QR Codes
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-4">
                  {/* Résumé */}
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={20} className="text-green-600" />
                      <span className="font-medium text-green-900 dark:text-green-100">
                        {batchResults.filter(r => r.success).length} QR Codes générés
                      </span>
                    </div>
                  </div>

                  {/* Grille des QR Codes */}
                  <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {batchResults.filter(r => r.success).map((qr, index) => (
                      <div key={index} className="bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                        <img src={qr.dataUrl} alt={`QR ${qr.data.roomNumber}`} className="w-full aspect-square" />
                        <p className="text-xs text-center mt-2 font-medium">
                          {qr.data.roomNumber}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleDownloadBatchPDF}
                      className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <FileDown size={20} />
                      Télécharger PDF
                    </button>
                    <button
                      onClick={handleClearBatch}
                      className="py-3 px-6 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                    >
                      Effacer
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeManager;