// src/services/qrCodeService.js

import QRCode from 'qrcode';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Service de gestion des QR Codes
 * - Génération de QR codes pour chambres et équipements
 * - Scan et décodage
 * - Création automatique d'interventions depuis QR
 */
class QRCodeService {
  
  /**
   * Générer un QR code pour une chambre
   */
  async generateRoomQRCode(roomNumber, options = {}) {
    const {
      size = 512,
      errorCorrectionLevel = 'H', // L, M, Q, H
      includeMetadata = true
    } = options;

    try {
      const qrData = {
        type: 'room',
        roomNumber,
        appUrl: window.location.origin,
        timestamp: new Date().toISOString()
      };

      const qrString = JSON.stringify(qrData);
      
      // Générer le QR code en data URL
      const qrCodeDataUrl = await QRCode.toDataURL(qrString, {
        width: size,
        margin: 2,
        errorCorrectionLevel,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return {
        success: true,
        dataUrl: qrCodeDataUrl,
        data: qrData,
        downloadUrl: this.createDownloadUrl(qrCodeDataUrl, `chambre-${roomNumber}.png`)
      };
    } catch (error) {
      console.error('Erreur génération QR code chambre:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Générer un QR code pour un équipement
   */
  async generateEquipmentQRCode(equipment, options = {}) {
    const {
      size = 512,
      errorCorrectionLevel = 'H'
    } = options;

    try {
      const qrData = {
        type: 'equipment',
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        category: equipment.category,
        serialNumber: equipment.serialNumber,
        appUrl: window.location.origin,
        timestamp: new Date().toISOString()
      };

      const qrString = JSON.stringify(qrData);
      
      const qrCodeDataUrl = await QRCode.toDataURL(qrString, {
        width: size,
        margin: 2,
        errorCorrectionLevel,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return {
        success: true,
        dataUrl: qrCodeDataUrl,
        data: qrData,
        downloadUrl: this.createDownloadUrl(qrCodeDataUrl, `equipement-${equipment.id}.png`)
      };
    } catch (error) {
      console.error('Erreur génération QR code équipement:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Générer un QR code pour une intervention
   */
  async generateInterventionQRCode(interventionId, options = {}) {
    const {
      size = 512,
      errorCorrectionLevel = 'M'
    } = options;

    try {
      const qrData = {
        type: 'intervention',
        interventionId,
        appUrl: window.location.origin,
        directUrl: `${window.location.origin}/interventions/${interventionId}`,
        timestamp: new Date().toISOString()
      };

      const qrString = JSON.stringify(qrData);
      
      const qrCodeDataUrl = await QRCode.toDataURL(qrString, {
        width: size,
        margin: 2,
        errorCorrectionLevel,
        color: {
          dark: '#4F46E5', // Indigo
          light: '#FFFFFF'
        }
      });

      return {
        success: true,
        dataUrl: qrCodeDataUrl,
        data: qrData,
        downloadUrl: this.createDownloadUrl(qrCodeDataUrl, `intervention-${interventionId}.png`)
      };
    } catch (error) {
      console.error('Erreur génération QR code intervention:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Générer plusieurs QR codes en batch
   */
  async generateBatchQRCodes(items, type = 'room') {
    try {
      const results = await Promise.all(
        items.map(async (item) => {
          if (type === 'room') {
            return await this.generateRoomQRCode(item.roomNumber);
          } else if (type === 'equipment') {
            return await this.generateEquipmentQRCode(item);
          }
        })
      );

      return {
        success: true,
        results,
        totalGenerated: results.filter(r => r.success).length
      };
    } catch (error) {
      console.error('Erreur génération batch QR codes:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Créer une URL de téléchargement
   */
  createDownloadUrl(dataUrl, filename) {
    return {
      dataUrl,
      filename,
      download: () => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
  }

  /**
   * Décoder un QR code depuis une image
   */
  async decodeQRCode(imageFile) {
    try {
      // Utiliser jsQR pour décoder
      const { default: jsQR } = await import('jsqr');
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const img = new Image();
          
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
              try {
                const data = JSON.parse(code.data);
                resolve({ success: true, data });
              } catch {
                // Si ce n'est pas du JSON, retourner la data brute
                resolve({ success: true, data: { raw: code.data } });
              }
            } else {
              reject(new Error('Aucun QR code détecté'));
            }
          };
          
          img.onerror = () => reject(new Error('Erreur de chargement de l\'image'));
          img.src = e.target.result;
        };
        
        reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
        reader.readAsDataURL(imageFile);
      });
    } catch (error) {
      console.error('Erreur décodage QR code:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Scanner un QR code avec la caméra
   */
  async scanQRCodeWithCamera(videoElement, onScan, onError) {
    try {
      const { default: jsQR } = await import('jsqr');
      
      // Demander l'accès à la caméra
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Caméra arrière sur mobile
      });
      
      videoElement.srcObject = stream;
      videoElement.setAttribute('playsinline', true);
      await videoElement.play();

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Fonction de scan en continu
      const scanFrame = () => {
        if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            try {
              const data = JSON.parse(code.data);
              
              // Arrêter le stream
              stream.getTracks().forEach(track => track.stop());
              
              onScan?.(data);
              return;
            } catch {
              // Continuer à scanner si le JSON est invalide
            }
          }
        }
        
        requestAnimationFrame(scanFrame);
      };

      scanFrame();

      return {
        success: true,
        stop: () => {
          stream.getTracks().forEach(track => track.stop());
        }
      };
    } catch (error) {
      console.error('Erreur scan caméra:', error);
      onError?.(error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Traiter les données d'un QR code scanné
   */
  async processScannedQRCode(qrData) {
    try {
      switch (qrData.type) {
        case 'room':
          return {
            success: true,
            type: 'room',
            action: 'create_intervention',
            data: {
              roomNumber: qrData.roomNumber,
              roomType: 'chambre'
            }
          };

        case 'equipment':
          return {
            success: true,
            type: 'equipment',
            action: 'create_intervention',
            data: {
              equipmentId: qrData.equipmentId,
              equipmentName: qrData.equipmentName,
              category: qrData.category
            }
          };

        case 'intervention':
          return {
            success: true,
            type: 'intervention',
            action: 'view_intervention',
            data: {
              interventionId: qrData.interventionId,
              directUrl: qrData.directUrl
            }
          };

        default:
          return {
            success: false,
            error: 'Type de QR code non reconnu'
          };
      }
    } catch (error) {
      console.error('Erreur traitement QR code:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sauvegarder le QR code dans Firestore
   */
  async saveQRCodeToFirestore(collectionName, documentId, qrData) {
    try {
      await updateDoc(doc(db, collectionName, documentId), {
        qrCode: qrData.dataUrl,
        qrCodeData: qrData.data,
        qrCodeGeneratedAt: new Date()
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur sauvegarde QR code:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Générer un PDF avec plusieurs QR codes (ex: toutes les chambres)
   */
  async generateQRCodePDF(qrCodes, options = {}) {
    try {
      const { default: jsPDF } = await import('jspdf');
      
      const {
        title = 'QR Codes',
        orientation = 'portrait',
        qrSize = 80,
        columns = 3
      } = options;

      const doc = new jsPDF(orientation);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const spacing = 10;
      
      let x = margin;
      let y = margin + 20;
      let count = 0;

      // Titre
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(title, pageWidth / 2, 15, { align: 'center' });

      // Ajouter chaque QR code
      for (const qr of qrCodes) {
        if (!qr.success) continue;

        // Nouvelle page si nécessaire
        if (y + qrSize + 20 > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }

        // Ajouter l'image QR
        doc.addImage(qr.dataUrl, 'PNG', x, y, qrSize, qrSize);
        
        // Ajouter le label
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const label = qr.data.roomNumber || qr.data.equipmentName || `QR ${count + 1}`;
        doc.text(label, x + qrSize / 2, y + qrSize + 5, { align: 'center' });

        // Prochaine position
        x += qrSize + spacing;
        count++;

        // Nouvelle ligne
        if (count % columns === 0) {
          x = margin;
          y += qrSize + 20;
        }
      }

      // Sauvegarder
      const filename = `qr-codes-${new Date().getTime()}.pdf`;
      doc.save(filename);

      return { success: true, filename };
    } catch (error) {
      console.error('Erreur génération PDF QR codes:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Générer un QR code avec logo personnalisé
   */
  async generateQRCodeWithLogo(data, logoUrl, options = {}) {
    const {
      size = 512,
      logoSize = size * 0.2
    } = options;

    try {
      // Générer le QR code de base
      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, JSON.stringify(data), {
        width: size,
        margin: 2,
        errorCorrectionLevel: 'H'
      });

      // Ajouter le logo
      const ctx = qrCanvas.getContext('2d');
      const logo = new Image();
      
      await new Promise((resolve, reject) => {
        logo.onload = resolve;
        logo.onerror = reject;
        logo.src = logoUrl;
      });

      // Position centrale
      const logoX = (size - logoSize) / 2;
      const logoY = (size - logoSize) / 2;

      // Fond blanc pour le logo
      ctx.fillStyle = 'white';
      ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);

      // Dessiner le logo
      ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);

      const dataUrl = qrCanvas.toDataURL('image/png');

      return {
        success: true,
        dataUrl,
        data
      };
    } catch (error) {
      console.error('Erreur QR code avec logo:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Vérifier si un QR code est valide et non expiré
   */
  isQRCodeValid(qrData, maxAge = 365 * 24 * 60 * 60 * 1000) {
    try {
      if (!qrData.timestamp) return true; // Pas de timestamp = toujours valide

      const age = Date.now() - new Date(qrData.timestamp).getTime();
      return age < maxAge;
    } catch {
      return false;
    }
  }

  /**
   * Obtenir des statistiques sur l'utilisation des QR codes
   */
  async getQRCodeStats(collectionName) {
    try {
      // Cette fonction nécessiterait une collection dédiée aux scans
      // Pour l'instant, retourne des stats basiques
      return {
        success: true,
        stats: {
          totalGenerated: 0,
          totalScanned: 0,
          mostScannedRooms: [],
          scansByDate: {}
        }
      };
    } catch (error) {
      console.error('Erreur statistiques QR codes:', error);
      return { success: false, error: error.message };
    }
  }
}

export const qrCodeService = new QRCodeService();
export default qrCodeService;