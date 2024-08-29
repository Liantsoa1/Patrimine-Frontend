import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs/promises';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// Chemin vers le fichier data.json
const dataFilePath = path.join(__dirname, '..', 'src', 'data', 'data.json');

// Endpoint pour récupérer la liste des possessions
app.get('/possession', async (req, res) => {
    try {
        const data = await fs.readFile(dataFilePath, 'utf8');
        const patrimoineData = JSON.parse(data);
        const possessions = patrimoineData.find(item => item.model === "Patrimoine").data.possessions; // Accéder à la bonne structure
        res.json(possessions);
    } catch (error) {
        console.error('Erreur lors de la récupération des possessions:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des possessions' });
    }
});

// Endpoint pour créer une nouvelle possession
app.post('/possession', async (req, res) => {
    try {
        const { libelle, valeur, dateDebut, taux, valeurConstante } = req.body;

        const newPossession = {
            libelle,
            valeur: Number(valeur),
            dateDebut,
            tauxAmortissement: Number(taux) || null,
            dateFin: null,
            valeurConstante: valeurConstante || null
        };

        const data = await fs.readFile(dataFilePath, 'utf8');
        const patrimoineData = JSON.parse(data);
        patrimoineData.data.possessions.push(newPossession);

        const updatedData = JSON.stringify(patrimoineData, null, 2);
        await fs.writeFile(dataFilePath, updatedData);
        res.status(201).json(newPossession);
    } catch (error) {
        console.error('Erreur lors de la création de la possession:', error);
        res.status(500).json({ message: 'Erreur lors de la création de la possession' });
    }
});

app.post('/possession/create', async (req, res) => {
    try {
        const { libelle, valeur, dateDebut, dateFin, tauxAmortissement } = req.body;

        const data = await fs.readFile(dataFilePath, 'utf8');
        const patrimoineData = JSON.parse(data);

        const possessions = patrimoineData.find(item => item.model === "Patrimoine").data.possessions;

        const newPossession = {
            libelle,
            valeur: Number(valeur), 
            dateDebut,
            dateFin,
            tauxAmortissement: Number(tauxAmortissement) 
        };

        possessions.push(newPossession); 

        const updatedData = JSON.stringify(patrimoineData, null, 2);
        await fs.writeFile(dataFilePath, updatedData);

        res.status(201).json(newPossession);
    } catch (error) {
        console.error('Erreur lors de la création de la possession:', error);
        res.status(500).json({ message: 'Erreur lors de la création de la possession' });
    }
});

app.put('/possession/:libelle', async (req, res) => {
    try {
        const { libelle } = req.params; 
        const { dateFin, tauxAmortissement } = req.body; 

        const dataFilePath = path.join(__dirname, '..', 'src', 'data', 'data.json');
        const data = await fs.readFile(dataFilePath, 'utf8');
        const patrimoineData = JSON.parse(data).find(item => item.model === "Patrimoine");

        // Trouver la possession à mettre à jour
        const possessionIndex = patrimoineData.data.possessions.findIndex(p => p.libelle === libelle);
        if (possessionIndex === -1) {
            return res.status(404).json({ message: 'Possession non trouvée' });
        }

        const possession = patrimoineData.data.possessions[possessionIndex];

        if (possession.valeurConstante !== null) {
            return res.status(400).json({ message: 'Impossible de modifier une possession avec une valeur constante.' });
        }

        possession.dateFin = dateFin !== undefined ? dateFin : possession.dateFin;
        possession.tauxAmortissement = tauxAmortissement !== undefined ? Number(tauxAmortissement) : possession.tauxAmortissement;

        const updatedData = JSON.stringify({ possessions: patrimoineData.data.possessions }, null, 2);
        await fs.writeFile(dataFilePath, updatedData);

        res.json(possession);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la possession:', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour de la possession' });
    }
});

// Endpoint pour clôturer une possession
app.post('/possession/:libelle/close', async (req, res) => {
    try {
        const { libelle } = req.params;
        const data = await fs.readFile(dataFilePath, 'utf8');
        const possessions = JSON.parse(data).data.possessions;

        const possessionIndex = possessions.findIndex(p => p.libelle === libelle);
        if (possessionIndex === -1) {
            return res.status(404).json({ message: 'Possession non trouvée' });
        }

        possessions[possessionIndex].dateFin = new Date().toISOString();

        const updatedData = JSON.stringify({ data: { possessions } }, null, 2);
        await fs.writeFile(dataFilePath, updatedData);

        res.json(possessions[possessionIndex]);
    } catch (error) {
        console.error('Erreur lors de la fermeture de la possession:', error);
        res.status(500).json({ message: 'Erreur lors de la fermeture de la possession' });
    }
});

// Endpoint pour récupérer la valeur du patrimoine à une date donnée
app.get('/patrimoine/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const dateObject = new Date(date);

        const data = await fs.readFile(dataFilePath, 'utf8');
        const possessions = JSON.parse(data).possessions;

        let totalValeur = 0;
        possessions.forEach(possession => {
            const dateDebut = new Date(possession.dateDebut);
            const dateFin = possession.dateFin ? new Date(possession.dateFin) : new Date(); 

            if (dateObject >= dateDebut && dateObject <= dateFin) {
                totalValeur += calculateValue(
                    possession.valeur,
                    possession.dateDebut,
                    possession.tauxAmortissement,
                    possession.valeurConstante,
                    date
                );
            }
        });

        
        res.json({ date: date, valeur: totalValeur });
    } catch (error) {
        console.error('Erreur lors de la récupération de la valeur du patrimoine:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération de la valeur du patrimoine' });
    }
});

app.post('/possession/create', async (req, res) => {
    try {
        const { libelle, valeur, dateDebut, dateFin, tauxAmortissement } = req.body;

        const data = await fs.readFile(dataFilePath, 'utf8');
        const patrimoineData = JSON.parse(data);

        const patrimoine = patrimoineData.find(item => item.model === "Patrimoine");

        if (!patrimoine || !Array.isArray(patrimoine.data.possessions)) {
            return res.status(500).json({ message: 'Structure de données invalide' });
        }

        const newPossession = {
            libelle,
            valeur,
            dateDebut,
            dateFin,
            tauxAmortissement
        };

        patrimoine.data.possessions.push(newPossession); 

    
        const updatedData = JSON.stringify(patrimoineData, null, 2);
        await fs.writeFile(dataFilePath, updatedData);

        res.status(201).json(newPossession);
    } catch (error) {
        console.error('Erreur lors de la création de la possession:', error);
        res.status(500).json({ message: 'Erreur lors de la création de la possession' });
    }
});

app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});