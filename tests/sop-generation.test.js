// Tests for intelligent SOP generation functionality

describe('SOP Generation Tests', () => {
    
    describe('Process Type Detection', () => {
        test('should detect refund process', () => {
            const input = "customer refund requests including validation and payment processing";
            const processType = detectProcessType(input);
            expect(processType).toBe('refund');
        });

        test('should detect onboarding process', () => {
            const input = "employee onboarding including IT setup and HR documentation";
            const processType = detectProcessType(input);
            expect(processType).toBe('onboarding');
        });

        test('should detect approval process', () => {
            const input = "expense approval workflow with manager review";
            const processType = detectProcessType(input);
            expect(processType).toBe('approval');
        });

        test('should detect procurement process', () => {
            const input = "vendor procurement and purchase order management";
            const processType = detectProcessType(input);
            expect(processType).toBe('procurement');
        });

        test('should default to generic for unknown process', () => {
            const input = "some random business process description";
            const processType = detectProcessType(input);
            expect(processType).toBe('generic');
        });
    });

    describe('BPMN Generation', () => {
        test('should generate refund process BPMN with decision points', () => {
            const processType = 'refund';
            const userInput = "customer refund processing";
            const bpmn = generateBusinessProcessBPMN(processType, userInput);
            
            expect(bpmn).toContain('bpmn:exclusiveGateway');
            expect(bpmn).toContain('Validate Request');
            expect(bpmn).toContain('Check Policy');
            expect(bpmn).toContain('Process Payment');
        });

        test('should generate onboarding process BPMN with parallel tasks', () => {
            const processType = 'onboarding';
            const userInput = "employee onboarding";
            const bpmn = generateBusinessProcessBPMN(processType, userInput);
            
            expect(bpmn).toContain('bpmn:parallelGateway');
            expect(bpmn).toContain('IT Setup');
            expect(bpmn).toContain('HR Documentation');
        });
    });

    describe('Description Generation', () => {
        test('should generate contextual description for refund process', () => {
            const processType = 'refund';
            const userInput = "customer refund processing";
            const description = generateContextualDescription(processType, userInput);
            
            expect(description).toContain('customer satisfaction');
            expect(description).toContain('refund policy');
            expect(description).toContain('financial accuracy');
        });

        test('should generate contextual description for onboarding process', () => {
            const processType = 'onboarding';
            const userInput = "employee onboarding";
            const description = generateContextualDescription(processType, userInput);
            
            expect(description).toContain('new employee');
            expect(description).toContain('productivity');
            expect(description).toContain('compliance');
        });
    });

    describe('Procedure Steps Generation', () => {
        test('should generate actionable steps for refund process', () => {
            const processType = 'refund';
            const userInput = "customer refund processing";
            const steps = generateActionableProcedureSteps(processType, userInput);
            
            expect(steps).toContain('Receive and validate refund request');
            expect(steps).toContain('Verify customer eligibility');
            expect(steps).toContain('Process payment');
            expect(steps).toContain('Send confirmation');
        });

        test('should generate actionable steps for onboarding process', () => {
            const processType = 'onboarding';
            const userInput = "employee onboarding";
            const steps = generateActionableProcedureSteps(processType, userInput);
            
            expect(steps).toContain('Prepare workspace');
            expect(steps).toContain('Create user accounts');
            expect(steps).toContain('Schedule orientation');
        });
    });

    describe('Risk Assessment Generation', () => {
        test('should generate relevant risks for refund process', () => {
            const processType = 'refund';
            const risks = generateRiskAssessment(processType);
            
            expect(risks).toContain('Fraudulent refund requests');
            expect(risks).toContain('Processing delays');
            expect(risks).toContain('Financial loss');
        });
    });

    describe('Control Measures Generation', () => {
        test('should generate KPIs for refund process', () => {
            const processType = 'refund';
            const controls = generateControlMeasures(processType);
            
            expect(controls).toContain('Average processing time');
            expect(controls).toContain('Refund accuracy rate');
            expect(controls).toContain('Customer satisfaction score');
        });
    });
});
