import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import supabase from '../lib/supabase.js';
import authenticateUser from '../middleware/auth.js';

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key'
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const calculateXPReward = (scanType) => {
  const rewards = {
    food: 5,
    body: 8,
    face: 6
  };
  return rewards[scanType] || 5;
};

const updateUserXP = async (userId, xpToAdd) => {
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('xp, level, streak_days, last_activity_date')
    .eq('id', userId)
    .single();

  if (fetchError) throw fetchError;

  const newXP = user.xp + xpToAdd;
  const currentLevel = user.level;
  const xpForNextLevel = currentLevel * 100;
  const newLevel = Math.floor(newXP / 100) + 1;

  const today = new Date().toISOString().split('T')[0];
  const lastActivity = user.last_activity_date;
  let newStreakDays = user.streak_days || 0;

  if (lastActivity) {
    const lastDate = new Date(lastActivity);
    const currentDate = new Date(today);
    const diffTime = currentDate - lastDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      newStreakDays += 1;
    } else if (diffDays > 1) {
      newStreakDays = 1;
    }
  } else {
    newStreakDays = 1;
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({
      xp: newXP,
      level: newLevel,
      streak_days: newStreakDays,
      last_activity_date: today
    })
    .eq('id', userId);

  if (updateError) throw updateError;

  return { newXP, newLevel, leveledUp: newLevel > currentLevel };
};

router.post('/food', authenticateUser, upload.single('image'), async (req, res) => {
  try {
    const userId = req.user.id;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const base64Image = imageFile.buffer.toString('base64');
    const imageDataUrl = `data:${imageFile.mimetype};base64,${base64Image}`;

    let analysis = {
      food_items: [],
      total_calories: 0,
      macros: { protein: 0, carbs: 0, fats: 0 },
      health_score: 0,
      recommendations: []
    };

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy-key') {
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze this food image and provide: 1) List of food items, 2) Estimated calories, 3) Macros (protein, carbs, fats in grams), 4) Health score (0-100), 5) Nutritional recommendations. Format as JSON.'
                },
                {
                  type: 'image_url',
                  image_url: { url: imageDataUrl }
                }
              ]
            }
          ],
          max_tokens: 500
        });

        const aiResponse = response.choices[0].message.content;
        try {
          analysis = JSON.parse(aiResponse);
        } catch {
          analysis.recommendations = [aiResponse];
        }
      } catch (aiError) {
        console.error('OpenAI API error:', aiError);
        analysis.recommendations = ['AI analysis unavailable. Using mock data.'];
      }
    } else {
      analysis = {
        food_items: ['Healthy meal'],
        total_calories: 450,
        macros: { protein: 25, carbs: 40, fats: 15 },
        health_score: 75,
        recommendations: ['Great balanced meal! Consider adding more vegetables.']
      };
    }

    const xpAwarded = calculateXPReward('food');

    const { data: scanResult, error: insertError } = await supabase
      .from('scanner_results')
      .insert({
        user_id: userId,
        scan_type: 'food',
        image_url: imageDataUrl,
        analysis_data: analysis,
        xp_awarded: xpAwarded
      })
      .select()
      .single();

    if (insertError) throw insertError;

    const xpUpdate = await updateUserXP(userId, xpAwarded);

    res.json({
      message: 'Food scan completed successfully',
      scan: scanResult,
      analysis,
      xp_awarded: xpAwarded,
      ...xpUpdate
    });
  } catch (error) {
    console.error('Food scan error:', error);
    res.status(500).json({ error: 'Food scan failed' });
  }
});

router.post('/body', authenticateUser, upload.single('image'), async (req, res) => {
  try {
    const userId = req.user.id;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const base64Image = imageFile.buffer.toString('base64');
    const imageDataUrl = `data:${imageFile.mimetype};base64,${base64Image}`;

    let analysis = {
      posture_score: 0,
      body_composition: {},
      measurements: {},
      recommendations: []
    };

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy-key') {
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze this body posture image and provide: 1) Posture score (0-100), 2) Body composition insights, 3) Estimated measurements, 4) Fitness recommendations. Format as JSON.'
                },
                {
                  type: 'image_url',
                  image_url: { url: imageDataUrl }
                }
              ]
            }
          ],
          max_tokens: 500
        });

        const aiResponse = response.choices[0].message.content;
        try {
          analysis = JSON.parse(aiResponse);
        } catch {
          analysis.recommendations = [aiResponse];
        }
      } catch (aiError) {
        console.error('OpenAI API error:', aiError);
        analysis.recommendations = ['AI analysis unavailable. Using mock data.'];
      }
    } else {
      analysis = {
        posture_score: 82,
        body_composition: { muscle_mass: 'good', body_fat: 'average' },
        measurements: { shoulders: 'aligned', spine: 'straight' },
        recommendations: ['Great posture! Work on core strength for improvement.']
      };
    }

    const xpAwarded = calculateXPReward('body');

    const { data: scanResult, error: insertError } = await supabase
      .from('scanner_results')
      .insert({
        user_id: userId,
        scan_type: 'body',
        image_url: imageDataUrl,
        analysis_data: analysis,
        xp_awarded: xpAwarded
      })
      .select()
      .single();

    if (insertError) throw insertError;

    const xpUpdate = await updateUserXP(userId, xpAwarded);

    res.json({
      message: 'Body scan completed successfully',
      scan: scanResult,
      analysis,
      xp_awarded: xpAwarded,
      ...xpUpdate
    });
  } catch (error) {
    console.error('Body scan error:', error);
    res.status(500).json({ error: 'Body scan failed' });
  }
});

router.post('/face', authenticateUser, upload.single('image'), async (req, res) => {
  try {
    const userId = req.user.id;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const base64Image = imageFile.buffer.toString('base64');
    const imageDataUrl = `data:${imageFile.mimetype};base64,${base64Image}`;

    let analysis = {
      skin_health_score: 0,
      skin_type: '',
      concerns: [],
      recommendations: []
    };

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy-key') {
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze this facial image for skin health and provide: 1) Skin health score (0-100), 2) Skin type, 3) Visible concerns, 4) Beauty and skincare recommendations. Format as JSON.'
                },
                {
                  type: 'image_url',
                  image_url: { url: imageDataUrl }
                }
              ]
            }
          ],
          max_tokens: 500
        });

        const aiResponse = response.choices[0].message.content;
        try {
          analysis = JSON.parse(aiResponse);
        } catch {
          analysis.recommendations = [aiResponse];
        }
      } catch (aiError) {
        console.error('OpenAI API error:', aiError);
        analysis.recommendations = ['AI analysis unavailable. Using mock data.'];
      }
    } else {
      analysis = {
        skin_health_score: 85,
        skin_type: 'combination',
        concerns: ['minor dryness'],
        recommendations: ['Your skin looks healthy! Stay hydrated and use moisturizer daily.']
      };
    }

    const xpAwarded = calculateXPReward('face');

    const { data: scanResult, error: insertError } = await supabase
      .from('scanner_results')
      .insert({
        user_id: userId,
        scan_type: 'face',
        image_url: imageDataUrl,
        analysis_data: analysis,
        xp_awarded: xpAwarded
      })
      .select()
      .single();

    if (insertError) throw insertError;

    const xpUpdate = await updateUserXP(userId, xpAwarded);

    res.json({
      message: 'Face scan completed successfully',
      scan: scanResult,
      analysis,
      xp_awarded: xpAwarded,
      ...xpUpdate
    });
  } catch (error) {
    console.error('Face scan error:', error);
    res.status(500).json({ error: 'Face scan failed' });
  }
});

router.get('/history', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { scan_type } = req.query;

    let query = supabase
      .from('scanner_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (scan_type) {
      query = query.eq('scan_type', scan_type);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ scans: data });
  } catch (error) {
    console.error('Scan history error:', error);
    res.status(500).json({ error: 'Failed to fetch scan history' });
  }
});

router.get('/stats', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: scans, error } = await supabase
      .from('scanner_results')
      .select('scan_type, xp_awarded, created_at')
      .eq('user_id', userId);

    if (error) throw error;

    const stats = {
      total_scans: scans.length,
      scans_by_type: {
        food: scans.filter(s => s.scan_type === 'food').length,
        body: scans.filter(s => s.scan_type === 'body').length,
        face: scans.filter(s => s.scan_type === 'face').length
      },
      total_xp_earned: scans.reduce((sum, s) => sum + s.xp_awarded, 0),
      recent_scans: scans.slice(0, 5)
    };

    res.json(stats);
  } catch (error) {
    console.error('Scan stats error:', error);
    res.status(500).json({ error: 'Failed to fetch scan stats' });
  }
});

export default router;
