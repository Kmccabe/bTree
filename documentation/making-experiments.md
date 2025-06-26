# Making Experiments in bTree

This comprehensive guide explains how to create experiments in bTree using the Trust Game as a detailed example. Learn how to design, configure, and deploy economic experiments with blockchain-based incentives.

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Trust Game Creation Walkthrough](#trust-game-creation-walkthrough)
4. [Experiment Configuration](#experiment-configuration)
5. [Instructions and Documentation](#instructions-and-documentation)
6. [Testing and Deployment](#testing-and-deployment)
7. [How Bolt Helps in Experiment Creation](#how-bolt-helps-in-experiment-creation)
8. [Advanced Configuration](#advanced-configuration)
9. [Best Practices](#best-practices)

## Overview

bTree provides a comprehensive experiment creation system that allows researchers to design, configure, and deploy economic experiments with real monetary incentives. The platform supports various experiment types, with the Trust Game serving as our primary example due to its rich parameter space and real-time interaction requirements.

### Experiment Types Supported

- **Trust Games** ✅ (Fully implemented with real-time synchronization)
- **Public Goods Games** (Demo implementation)
- **Auction Mechanisms** (Planned)
- **Market Simulations** (Planned)
- **Behavioral Studies** (Planned)

## Getting Started

### Prerequisites

Before creating experiments, ensure you have:

1. **Development Environment**: bTree running locally or deployed
2. **Wallet Connection**: Algorand wallet (Pera Wallet recommended)
3. **Test Funds**: TestNet ALGO for testing (get from [Algorand TestNet Dispenser](https://testnet.algoexplorer.io/dispenser))
4. **Server Running**: Backend server for live experiments

### Access the Experiment Creator

1. **Navigate to Dashboard**: `http://localhost:5173/dashboard`
2. **Click "New Experiment"** or use the "+" button
3. **Choose Experiment Type**: Select from available experiment types

## Trust Game Creation Walkthrough

Let's create a complete Trust Game experiment step by step.

### Step 1: Basic Setup

#### Experiment Title
```
Trust and Reciprocity Study - Winter 2024
```

**Best Practices:**
- Use descriptive, professional titles
- Include time period or study identifier
- Keep under 60 characters for display purposes

#### Description
```
A behavioral economics study investigating trust and reciprocity between participants in a controlled environment with real monetary incentives.
```

**Guidelines:**
- Explain the research purpose clearly
- Mention real monetary incentives
- Keep it concise but informative

#### Experiment Type Selection

Choose **"Trust Game"** from the available options:

```javascript
{
  id: 'trust',
  name: 'Trust Game',
  description: 'Investigate trust and reciprocity between participants',
  icon: '🤲',
  parameters: ['initialEndowment', 'multiplier', 'rounds', 'roleAssignment', 'incrementSize']
}
```

### Step 2: Configuration Parameters

#### Basic Parameters

**Max Participants**
```
Value: 4 (must be even for Trust Games)
Range: 2-20 participants
```

**Duration**
```
Value: 15 minutes
Range: 5-180 minutes
```

**Reward Pool**
```
Value: 10 ALGO
Purpose: Total budget for participant payments
```

#### Trust Game Specific Parameters

**Initial Endowment**
```
Value: 1.0 ALGO
Description: Amount each player starts with per round
Range: 0.1-10 ALGO
```

**Multiplier**
```
Value: 2.0
Description: Factor by which sent amount is multiplied
Range: 1.0-5.0
```

**Number of Rounds**
```
Value: 1
Description: Total rounds per participant pair
Range: 1-50 rounds
```

**Increment Size**
```
Value: 0.1 ALGO
Description: Minimum decision increment
Options: 0.001, 0.01, 0.1, 0.5, 1.0 ALGO
```

**Time Per Decision**
```
Value: 300 seconds (5 minutes)
Description: Time limit for each player's decision
Options: 60s, 120s, 300s, 600s, 900s, 1800s
```

**Role Assignment**
```
Options:
- Random: Roles switch randomly each round
- Fixed: Players keep same role throughout
```

**Additional Options**
```
Show Round History: false
Anonymous Play: true
```

### Step 3: Instructions Creation

bTree automatically generates comprehensive instructions for Trust Games, but you can customize them:

#### Auto-Generated Instructions Structure

```markdown
# Welcome to the Trust Game Experiment!

## Overview
This experiment studies trust and reciprocity between participants...

## Roles
- **Player A (Trustor)**: Decides how much to send to Player B
- **Player B (Trustee)**: Receives the multiplied amount and decides how much to return

## How the Round Works
### 1. Initial Endowment
Both players start with **1.0 ALGO**

### 2. Player A's Decision
- Player A can send any amount (0 to 1.0 ALGO) to Player B in increments of **0.1 ALGO**
- The amount sent is multiplied by **2**
- Player A keeps: 1.0 ALGO - amount sent
- Time limit: **5 minutes**

### 3. Player B's Decision
- Player B receives: (amount sent by A) × **2**
- Player B decides how much to return to Player A (0 to full received amount)
- Player B keeps: received amount - amount returned
- Time limit: **5 minutes**

## Example Round
- Both players start with **1.0 ALGO**
- Player A sends **0.5 ALGO** to Player B
- Player B receives: 0.5 × 2 = **1.0 ALGO**
- Player B returns **0.6 ALGO** to Player A

### Final Payoffs
- **Player A**: 1.0 - 0.5 + 0.6 = **1.1 ALGO**
- **Player B**: 1.0 + 1.0 - 0.6 = **1.4 ALGO**

## Important Notes
- This is a **single-round** interaction
- Your role **remains the same** throughout
- All interactions are **anonymous**
- **No history** is shown between rounds
- Decision increments: **0.1 ALGO**
- Time per decision: **5 minutes**
- Your earnings will be **paid to your wallet**

## Strategy Tips
- Consider the **one-shot nature** of this interaction
- Think about what you would expect from your partner
- Remember that **cooperation can benefit both players**

## Waiting Process
- You must **read these instructions carefully**
- Click **"I Have Read the Instructions"** when ready
- Wait for **all participants** to finish reading
- The game will **start automatically** when everyone is ready

**Good luck!**
```

#### Customizing Instructions

You can modify the auto-generated instructions:

1. **Add Research Context**: Include information about your specific study
2. **Modify Examples**: Use different numerical examples
3. **Add Strategy Guidance**: Provide additional strategic considerations
4. **Include Consent Information**: Add IRB consent language if required

### Step 4: Review and Launch

#### Configuration Summary

The system displays a comprehensive summary:

```javascript
{
  title: "Trust and Reciprocity Study - Winter 2024",
  type: "Trust Game",
  maxParticipants: 4,
  duration: 15,
  rewardPool: 10,
  gameParameters: {
    initialEndowment: 1.0,
    multiplier: 2.0,
    rounds: 1,
    incrementSize: 0.1,
    timePerDecision: 300,
    roleAssignment: "random",
    showHistory: false,
    anonymity: true
  }
}
```

#### Launch Options

**Save as Draft**
- Saves configuration for later editing
- Stored in localStorage for demo purposes
- Can be loaded and modified later

**Test Demo**
- Launches single-user demo mode
- Allows testing of game mechanics
- No server connection required

**Launch Live**
- Creates live experiment on server
- Generates participant links
- Enables real-time multi-participant play

## Experiment Configuration

### Parameter Guidelines

#### Initial Endowment
```
Low Stakes: 0.1-0.5 ALGO
Medium Stakes: 1.0-2.0 ALGO
High Stakes: 5.0-10.0 ALGO
```

**Considerations:**
- Higher stakes increase participant motivation
- Consider your research budget
- TestNet vs MainNet implications

#### Multiplier Selection
```
Conservative: 1.5-2.0 (standard in literature)
Moderate: 2.5-3.0 (higher efficiency gains)
Aggressive: 3.5-5.0 (maximum cooperation incentive)
```

#### Time Limits
```
Quick Decisions: 60-120 seconds
Standard: 300 seconds (5 minutes)
Deliberative: 600-1800 seconds (10-30 minutes)
```

#### Increment Size Strategy
```
Fine-grained: 0.01-0.05 ALGO (precise decisions)
Standard: 0.1 ALGO (balanced precision/simplicity)
Coarse: 0.5-1.0 ALGO (simplified decisions)
```

### Advanced Configuration

#### Multi-Round Games
```javascript
{
  rounds: 10,
  roleAssignment: "fixed",     // Keep same roles
  showHistory: true,           // Show previous rounds
  endowmentReset: true        // Reset endowment each round
}
```

#### Dynamic Parameters
```javascript
{
  dynamicMultiplier: true,     // Multiplier changes per round
  multiplierSchedule: [2, 2.5, 3, 2.5, 2],  // Round-specific multipliers
  endowmentVariation: true,    // Random starting amounts
  communicationRounds: [3, 7]  // Allow chat in specific rounds
}
```

## Instructions and Documentation

### Markdown Support

bTree supports full Markdown syntax in instructions:

```markdown
# Headers
## Subheaders
### Sub-subheaders

**Bold text**
*Italic text*

- Bullet points
- Lists

1. Numbered
2. Lists

> Blockquotes for important information

`Code snippets` for technical details

[Links](https://example.com)

| Tables | Are | Supported |
|--------|-----|-----------|
| Data   | Can | Be        |
| Shown  | In  | Tables    |
```

### Instruction Best Practices

#### Structure
1. **Overview**: Brief experiment description
2. **Roles**: Clear role definitions
3. **Mechanics**: Step-by-step process
4. **Examples**: Numerical examples with calculations
5. **Rules**: Important constraints and timing
6. **Strategy**: Optional strategic guidance
7. **Process**: Waiting and start procedures

#### Content Guidelines
- **Use clear, simple language**
- **Provide concrete numerical examples**
- **Explain payment structure explicitly**
- **Include time constraints**
- **Emphasize synchronization requirements**

#### Example Sections

**Payment Explanation**
```markdown
## Payment Structure

Your earnings from this experiment will be automatically transferred to your connected Algorand wallet within 24 hours of completion.

**Exchange Rate**: All amounts shown in ALGO
**Network**: TestNet (no real monetary value) / MainNet (real cryptocurrency)
**Transaction Fees**: Covered by the research team
```

**Consent Information**
```markdown
## Participation Consent

By clicking "I Have Read the Instructions," you consent to:
- Participation in this research study
- Use of your decision data for research purposes
- Automatic payment processing to your wallet
- Anonymous data collection (no personal information)
```

### Preview System

The instruction preview system allows you to:
- **See formatted output** in real-time
- **Test markdown rendering**
- **Verify examples and calculations**
- **Check for clarity and completeness**

## Testing and Deployment

### Testing Strategy

#### 1. Demo Testing
```bash
# Test basic mechanics
npm run dev
# Navigate to: /trust-game/demo?role=A
```

#### 2. Multi-Tab Testing
```bash
# Start server
cd server && npm start

# Start frontend
npm run dev

# Create experiment, get participant link
# Open link in multiple tabs with same wallet
```

#### 3. Multi-Computer Testing
```bash
# Share participant link across different computers
# Test real network conditions
# Verify synchronization across devices
```

### Deployment Checklist

Before launching a live experiment:

- [ ] **Server running and accessible**
- [ ] **Wallet connected with sufficient funds**
- [ ] **Instructions reviewed and tested**
- [ ] **Parameters validated**
- [ ] **Payment system tested**
- [ ] **Participant recruitment ready**
- [ ] **Data collection plan in place**

### Launch Process

1. **Create Experiment**: Use experiment creator
2. **Generate Link**: System creates unique participant URL
3. **Share Link**: Distribute to participants
4. **Monitor Progress**: Use researcher dashboard
5. **Process Payments**: Use automated payment system
6. **Export Data**: Download results for analysis

## How Bolt Helps in Experiment Creation

Bolt serves as a powerful development environment that significantly enhances the experiment creation process in bTree. Here's how Bolt contributes to building and iterating on experimental economics platforms:

### Rapid Prototyping and Development

#### Real-Time Code Iteration
Bolt's live development environment allows for immediate testing of experiment modifications:

```javascript
// Example: Quickly testing new Trust Game parameters
const trustGameParams = {
  initialEndowment: 2.0,        // Instantly see UI changes
  multiplier: 3,                // Real-time parameter updates
  incrementSize: 0.05,          // Immediate validation
  timePerDecision: 180          // Live timer testing
};
```

**Benefits:**
- **Instant feedback** on parameter changes
- **Live preview** of instruction rendering
- **Real-time validation** of configuration options
- **Immediate testing** of UI components

#### Component-Based Development

Bolt's React environment enables modular experiment creation:

```jsx
// Reusable experiment components
<ExperimentCreator 
  experimentType="trust"
  onParameterChange={handleParameterUpdate}
  onInstructionUpdate={handleInstructionChange}
/>

<ParameterConfig 
  gameType="trust"
  parameters={trustGameParams}
  validation={parameterValidation}
/>

<InstructionEditor 
  markdown={instructions}
  preview={true}
  autoGenerate={true}
/>
```

### Advanced Development Features

#### Hot Module Replacement (HMR)
```bash
# Changes to experiment logic update instantly
# No need to restart server or lose state
# Preserves form data during development
```

#### TypeScript Integration
```typescript
interface TrustGameParameters {
  initialEndowment: number;
  multiplier: number;
  rounds: number;
  incrementSize: number;
  timePerDecision: number;
  roleAssignment: 'random' | 'fixed';
  showHistory: boolean;
  anonymity: boolean;
}

// Type-safe experiment configuration
const validateTrustGameConfig = (params: TrustGameParameters): boolean => {
  return params.initialEndowment > 0 && 
         params.multiplier >= 1 && 
         params.rounds > 0;
};
```

#### Integrated Debugging
```javascript
// Built-in debugging tools
console.log('Experiment parameters:', experimentConfig);
console.log('Generated instructions:', instructionMarkdown);
console.log('Validation results:', validationErrors);

// React DevTools integration
// Component state inspection
// Props debugging
```

### Experiment Design Workflow in Bolt

#### 1. Parameter Exploration
```javascript
// Quickly test different parameter combinations
const parameterSets = [
  { endowment: 1, multiplier: 2, rounds: 1 },
  { endowment: 2, multiplier: 3, rounds: 5 },
  { endowment: 0.5, multiplier: 4, rounds: 10 }
];

// Instantly switch between configurations
// See immediate UI updates
// Test instruction generation
```

#### 2. Instruction Development
```markdown
<!-- Live markdown preview -->
# Trust Game Instructions

Initial endowment: **{initialEndowment} ALGO**
Multiplier: **{multiplier}x**
Rounds: **{rounds}**

<!-- Variables automatically populated -->
<!-- Real-time preview updates -->
<!-- Syntax highlighting and validation -->
```

#### 3. UI/UX Testing
```jsx
// Test different layouts instantly
<TrustGameInterface 
  layout="compact"          // Switch layouts live
  theme="dark"              // Test themes
  animations={true}         // Toggle features
  debugMode={true}          // Show debug info
/>
```

### Collaborative Development

#### Version Control Integration
```bash
# Bolt integrates with Git
git add src/pages/ExperimentCreator.tsx
git commit -m "Add dynamic multiplier support to Trust Game"

# Branch-based experiment development
git checkout feature/auction-experiments
git checkout feature/public-goods-enhancements
```

#### Code Sharing and Documentation
```javascript
/**
 * Trust Game Parameter Configuration
 * 
 * @param {number} initialEndowment - Starting ALGO amount (0.1-10)
 * @param {number} multiplier - Multiplication factor (1-5)
 * @param {number} rounds - Number of rounds (1-50)
 * @param {number} incrementSize - Decision increment in ALGO
 * @param {number} timePerDecision - Time limit in seconds
 * @param {'random'|'fixed'} roleAssignment - Role assignment strategy
 * @param {boolean} showHistory - Show previous round results
 * @param {boolean} anonymity - Anonymous participant play
 */
```

### Testing and Validation

#### Automated Testing
```javascript
// Jest testing integration
describe('Trust Game Configuration', () => {
  test('validates parameter ranges', () => {
    expect(validateEndowment(1.0)).toBe(true);
    expect(validateEndowment(-1.0)).toBe(false);
  });
  
  test('generates correct instructions', () => {
    const instructions = generateTrustGameInstructions(params);
    expect(instructions).toContain('1.0 ALGO');
    expect(instructions).toContain('multiplied by 2');
  });
});
```

#### Live Validation
```typescript
// Real-time parameter validation
const useParameterValidation = (params: TrustGameParameters) => {
  const [errors, setErrors] = useState<string[]>([]);
  
  useEffect(() => {
    const validationErrors = validateParameters(params);
    setErrors(validationErrors);
  }, [params]);
  
  return errors;
};
```

### Deployment and Production

#### Build Optimization
```bash
# Bolt optimizes builds automatically
npm run build

# Generates optimized production bundle
# Includes only necessary experiment code
# Optimizes assets and dependencies
```

#### Environment Configuration
```javascript
// Environment-specific settings
const config = {
  development: {
    apiUrl: 'http://localhost:3001',
    network: 'testnet',
    debug: true
  },
  production: {
    apiUrl: 'https://api.btree-experiments.com',
    network: 'mainnet',
    debug: false
  }
};
```

### Best Practices with Bolt

#### 1. Modular Development
- **Separate components** for different experiment types
- **Reusable parameter configurations**
- **Shared instruction templates**
- **Common validation logic**

#### 2. State Management
```javascript
// Centralized experiment state
const useExperimentState = () => {
  const [config, setConfig] = useState(defaultConfig);
  const [validation, setValidation] = useState({});
  const [instructions, setInstructions] = useState('');
  
  return { config, validation, instructions, setConfig };
};
```

#### 3. Performance Optimization
- **Lazy loading** of experiment components
- **Memoization** of expensive calculations
- **Debounced validation** for real-time feedback
- **Optimized re-renders** for parameter changes

#### 4. Error Handling
```javascript
// Comprehensive error boundaries
const ExperimentErrorBoundary = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={<ExperimentCreationError />}
      onError={logExperimentError}
    >
      {children}
    </ErrorBoundary>
  );
};
```

## Advanced Configuration

### Custom Experiment Types

#### Creating New Experiment Types

1. **Define Experiment Schema**
```typescript
interface AuctionGameParameters {
  auctionType: 'english' | 'dutch' | 'sealed-bid';
  startingBid: number;
  bidIncrement: number;
  timeLimit: number;
  reservePrice?: number;
}
```

2. **Add to Experiment Creator**
```javascript
const experimentTypes = [
  // ... existing types
  {
    id: 'auction',
    name: 'Auction Mechanism',
    description: 'Test different auction formats and bidding strategies',
    icon: '🏆',
    parameters: ['auctionType', 'startingBid', 'bidIncrement']
  }
];
```

3. **Implement Parameter Interface**
```jsx
const AuctionParameterConfig = ({ parameters, onChange }) => {
  return (
    <div className="space-y-4">
      <SelectField
        label="Auction Type"
        value={parameters.auctionType}
        options={['english', 'dutch', 'sealed-bid']}
        onChange={(value) => onChange('auctionType', value)}
      />
      {/* Additional parameter fields */}
    </div>
  );
};
```

### Dynamic Parameter Generation

```javascript
// Generate parameters based on research design
const generateParameterMatrix = (baseParams, variations) => {
  return variations.map(variation => ({
    ...baseParams,
    ...variation,
    id: generateUniqueId(),
    condition: variation.name
  }));
};

// Example: Generate multiple Trust Game conditions
const trustGameConditions = generateParameterMatrix(
  { initialEndowment: 1, rounds: 1 },
  [
    { name: 'low-trust', multiplier: 1.5 },
    { name: 'medium-trust', multiplier: 2.0 },
    { name: 'high-trust', multiplier: 3.0 }
  ]
);
```

### Integration with External Systems

#### Data Export Configuration
```javascript
const exportConfig = {
  formats: ['csv', 'json', 'spss'],
  fields: [
    'participantId',
    'experimentCondition', 
    'decisionTime',
    'amountSent',
    'amountReturned',
    'finalEarnings'
  ],
  anonymization: true,
  encryption: true
};
```

#### API Integration
```javascript
// Connect to external survey systems
const surveyIntegration = {
  preExperiment: 'https://qualtrics.com/survey/pre',
  postExperiment: 'https://qualtrics.com/survey/post',
  participantMapping: true
};
```

## Best Practices

### Experiment Design Principles

#### 1. Clear Objectives
- Define specific research questions
- Choose appropriate experiment type
- Set measurable outcomes

#### 2. Parameter Selection
- Base on existing literature
- Consider participant motivation
- Test with pilot studies

#### 3. Instruction Clarity
- Use simple, clear language
- Provide concrete examples
- Test comprehension

#### 4. Technical Robustness
- Test all scenarios thoroughly
- Plan for network issues
- Have backup procedures

### Research Ethics

#### Informed Consent
```markdown
## Informed Consent

This research study investigates economic decision-making. Your participation involves:

- Making decisions in an economic game
- Receiving monetary payments based on your choices
- Anonymous data collection for research purposes

**Risks**: Minimal risk beyond normal daily activities
**Benefits**: Monetary compensation and contribution to research
**Confidentiality**: All data collected anonymously
**Withdrawal**: You may withdraw at any time without penalty
```

#### Data Protection
- Collect only necessary data
- Anonymize participant information
- Secure data storage and transmission
- Clear data retention policies

### Quality Assurance

#### Pre-Launch Checklist
- [ ] Parameters validated against research design
- [ ] Instructions tested for clarity
- [ ] Payment system verified
- [ ] Multi-device testing completed
- [ ] Backup procedures in place
- [ ] Data collection plan ready

#### During Experiment
- Monitor participant progress
- Watch for technical issues
- Be available for participant questions
- Document any anomalies

#### Post-Experiment
- Process payments promptly
- Export and backup data
- Conduct participant debriefing
- Document lessons learned

---

This comprehensive guide provides everything needed to create sophisticated economic experiments in bTree. The platform's integration with Bolt enables rapid development and iteration, making it an ideal environment for experimental economics research.

For additional support or advanced customization needs, refer to the main documentation or contact the development team.