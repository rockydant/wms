describe('PickingController', () => {
  let $controller;
  let $rootScope;
  let $httpBackend;
  let controller;
  let ApiService;

  beforeEach(angular.mock.module('fulfillflow'));

  beforeEach(inject((
    _$controller_,
    _$rootScope_,
    _$httpBackend_,
    _ApiService_,
  ) => {
    $controller = _$controller_;
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    ApiService = _ApiService_;
  }));

  beforeEach(() => {
    const $scope = $rootScope.$new();
    controller = $controller('PickingController', {
      $scope,
      ApiService,
    });
  });

  afterEach(() => {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('loadOrderQueues', () => {
    it('should load order queues', () => {
      const queues = [
        { id: '1', priority: 'Rush', status: 'Pending' },
        { id: '2', priority: 'Regular', status: 'In Progress' },
      ];

      $httpBackend.expectGET('/api/v1/picking/queues').respond(200, queues);

      if (controller.loadOrderQueues) {
        controller.loadOrderQueues();
        $httpBackend.flush();

        expect(controller.queues).toEqual(queues);
      }
    });
  });

  describe('getOptimizedRoute', () => {
    it('should get optimized route for order queue', () => {
      const queueId = '1';
      const route = {
        route: {
          waypoints: [
            { sequence: 1, locationCode: 'WH-A-1-1-1' },
            { sequence: 2, locationCode: 'WH-A-2-1-1' },
          ],
        },
        summary: {
          totalLocations: 2,
          totalDistance: 150,
          estimatedTime: 15,
        },
      };

      $httpBackend
        .expectGET(`/api/v1/picking/queues/${queueId}/route`)
        .respond(200, route);

      if (controller.getOptimizedRoute) {
        controller.getOptimizedRoute(queueId);
        $httpBackend.flush();
      }
    });
  });
});
