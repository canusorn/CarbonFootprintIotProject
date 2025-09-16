/**
 * Validation utilities for power meter data
 */

/**
 * Validates 3-phase power meter data structure
 * @param {Object} data - The power meter data to validate
 * @returns {Object} - { isValid: boolean, errors: string[], sanitizedData: Object }
 */
function validatePowerMeterData(data) {
  const errors = [];
  const sanitizedData = {};
  
  // Required fields for 3-phase power meter
  const requiredFields = [
    'Va', 'Vb', 'Vc',     // Voltage phases A, B, C
    'Ia', 'Ib', 'Ic',     // Current phases A, B, C
    'Pa', 'Pb', 'Pc',     // Power phases A, B, C
    'PFa', 'PFb', 'PFc',  // Power Factor phases A, B, C
    'Ei', 'Ee', 'Et'   // Energy Import, Export, Total
  ];
  
  // Check if data is an object
  if (!data || typeof data !== 'object') {
    errors.push('Data must be a valid JSON object');
    return { isValid: false, errors, sanitizedData: null };
  }
  
  // Validate each required field
  for (const field of requiredFields) {
    if (!(field in data)) {
      errors.push(`Missing required field: ${field}`);
    } else {
      const value = parseFloat(data[field]);
      if (isNaN(value)) {
        errors.push(`Field '${field}' must be a valid number, got: ${data[field]}`);
      } else {
        sanitizedData[field] = value;
      }
    }
  }
  
  // Add timestamp if not provided
  if (data.time) {
    const timestamp = new Date(data.time);
    if (isNaN(timestamp.getTime())) {
      errors.push('Invalid timestamp format in field: time');
    } else {
      sanitizedData.time = timestamp;
    }
  } else {
    sanitizedData.time = new Date(); // Use current time if not provided
  }
  
  // Validate ranges for specific fields
  if (sanitizedData.Va !== undefined && (sanitizedData.Va < 0 || sanitizedData.Va > 1000)) {
    errors.push('Voltage Va should be between 0-1000V');
  }
  if (sanitizedData.Vb !== undefined && (sanitizedData.Vb < 0 || sanitizedData.Vb > 1000)) {
    errors.push('Voltage Vb should be between 0-1000V');
  }
  if (sanitizedData.Vc !== undefined && (sanitizedData.Vc < 0 || sanitizedData.Vc > 1000)) {
    errors.push('Voltage Vc should be between 0-1000V');
  }
  
  // Validate power factor range (-1 to 1)
  ['PFa', 'PFb', 'PFc'].forEach(pf => {
    if (sanitizedData[pf] !== undefined && (sanitizedData[pf] < -1 || sanitizedData[pf] > 1)) {
      errors.push(`Power factor ${pf} should be between -1 and 1`);
    }
  });
  
  // Validate current range (0 to 1000A)
  ['Ia', 'Ib', 'Ic'].forEach(current => {
    if (sanitizedData[current] !== undefined && (sanitizedData[current] < 0 || sanitizedData[current] > 1000)) {
      errors.push(`Current ${current} should be between 0-1000A`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizedData : null
  };
}

/**
 * Validates ESP device ID format
 * @param {string} espId - The ESP device ID to validate
 * @returns {Object} - { isValid: boolean, error: string }
 */
function validateEspId(espId) {
  if (!espId || typeof espId !== 'string') {
    return { isValid: false, error: 'ESP ID must be a non-empty string' };
  }
  
  // ESP ID should be alphanumeric and underscores, 3-32 characters
  const espIdPattern = /^[a-zA-Z0-9_-]{3,32}$/;
  if (!espIdPattern.test(espId)) {
    return { 
      isValid: false, 
      error: 'ESP ID must be 3-32 characters long and contain only letters, numbers, and underscores' 
    };
  }
  
  return { isValid: true, error: null };
}

module.exports = {
  validatePowerMeterData,
  validateEspId
};