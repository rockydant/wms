describe('ApiService', () => {
  let service;
  let $httpBackend;
  let $rootScope;
  let AuthService;

  beforeEach(angular.mock.module('fulfillflow'));

  beforeEach(inject((_ApiService_, _$httpBackend_, _$rootScope_, _AuthService_) => {
    service = _ApiService_;
    $httpBackend = _$httpBackend_;
    $rootScope = _$rootScope_;
    AuthService = _AuthService_;
    
    // Mock AuthService.getToken
    spyOn(AuthService, 'getToken').and.returnValue('mock-token');
  }));

  afterEach(() => {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('getCustomers', () => {
    it('should fetch customers', () => {
      const customers = [{ id: '1', name: 'Customer 1' }];
      
      $httpBackend.expectGET('/api/v1/customers').respond(200, customers);
      
      service.get('/customers').then((response) => {
        expect(response.data).toEqual(customers);
      });
      
      $httpBackend.flush();
    });
  });

  describe('createShipment', () => {
    it('should create a shipment', () => {
      const shipmentData = {
        customerId: '1',
        warehouseId: 'warehouse-1',
        items: [{ sku: 'SKU001', size: 'M', color: 'Blue', quantity: 5 }],
      };
      
      const responseShipment = {
        id: 'shipment-1',
        ...shipmentData,
        status: 'Pending',
      };
      
      $httpBackend.expectPOST('/api/v1/shipments', shipmentData).respond(201, responseShipment);
      
      service.post('/shipments', shipmentData).then((response) => {
        expect(response.data).toEqual(responseShipment);
      });
      
      $httpBackend.flush();
    });
  });

  describe('getReports', () => {
    it('should fetch insight reports', () => {
      const report = {
        period: { startDate: '2025-01-01', endDate: '2025-01-31' },
        kpis: {},
      };
      
      $httpBackend.expectGET('/api/v1/reports/insights/executive').respond(200, report);
      
      service.get('/reports/insights/executive').then((response) => {
        expect(response.data).toEqual(report);
      });
      
      $httpBackend.flush();
    });

    it('should fetch department performance reports', () => {
      const report = {
        period: { startDate: '2025-01-01', endDate: '2025-01-31' },
        departments: {},
      };
      
      $httpBackend.expectGET('/api/v1/reports/performance/departments').respond(200, report);
      
      service.get('/reports/performance/departments').then((response) => {
        expect(response.data).toEqual(report);
      });
      
      $httpBackend.flush();
    });
  });

  describe('getRealtimeDashboard', () => {
    it('should fetch realtime dashboard data', () => {
      const dashboard = {
        timestamp: new Date().toISOString(),
        today: {},
        summary: {},
      };
      
      $httpBackend.expectGET('/api/v1/dashboard/realtime-operations').respond(200, dashboard);
      
      service.get('/dashboard/realtime-operations').then((response) => {
        expect(response.data).toEqual(dashboard);
      });
      
      $httpBackend.flush();
    });
  });
});
