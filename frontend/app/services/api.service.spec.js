describe('ApiService', () => {
  let service;
  let $httpBackend;
  let $rootScope;

  beforeEach(angular.mock.module('fulfillflow'));

  beforeEach(inject((_ApiService_, _$httpBackend_, _$rootScope_) => {
    service = _ApiService_;
    $httpBackend = _$httpBackend_;
    $rootScope = _$rootScope_;
  }));

  afterEach(() => {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('getCustomers', () => {
    it('should fetch customers', () => {
      const customers = [{ id: '1', name: 'Customer 1' }];
      
      $httpBackend.expectGET('/api/v1/customers').respond(200, customers);
      
      service.getCustomers().then((response) => {
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
      
      service.createShipment(shipmentData).then((response) => {
        expect(response.data).toEqual(responseShipment);
      });
      
      $httpBackend.flush();
    });
  });
});
