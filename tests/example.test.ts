/**
 * Example Tests - 测试示例
 *
 * 包含基础测试用例用于验证测试框架配置
 */

describe('Example Tests', () => {
  describe('Basic Assertions', () => {
    it('should pass basic equality check', () => {
      expect(1 + 1).toBe(2);
    });

    it('should pass object comparison', () => {
      expect({ name: 'test' }).toEqual({ name: 'test' });
    });

    it('should pass array comparison', () => {
      expect([1, 2, 3]).toEqual([1, 2, 3]);
    });

    it('should handle truthy and falsy values', () => {
      expect(true).toBeTruthy();
      expect(false).toBeFalsy();
      expect(null).toBeNull();
      expect(undefined).toBeUndefined();
    });
  });

  describe('String Operations', () => {
    it('should handle string matching', () => {
      const text = 'Hello, World!';
      expect(text).toContain('World');
      expect(text).toMatch(/World/);
    });

    it('should handle string transformations', () => {
      expect('hello'.toUpperCase()).toBe('HELLO');
      expect('HELLO'.toLowerCase()).toBe('hello');
    });
  });

  describe('Array Operations', () => {
    it('should filter and map arrays', () => {
      const numbers = [1, 2, 3, 4, 5];
      const evens = numbers.filter(n => n % 2 === 0);
      const doubled = numbers.map(n => n * 2);

      expect(evens).toEqual([2, 4]);
      expect(doubled).toEqual([2, 4, 6, 8, 10]);
    });

    it('should reduce arrays', () => {
      const numbers = [1, 2, 3, 4];
      const sum = numbers.reduce((acc, n) => acc + n, 0);
      expect(sum).toBe(10);
    });
  });

  describe('Async Operations', () => {
    it('should handle promises', async () => {
      const promise = Promise.resolve('success');
      await expect(promise).resolves.toBe('success');
    });

    it('should handle async/await', async () => {
      const fetchData = () => Promise.resolve({ data: 'test' });
      const result = await fetchData();
      expect(result.data).toBe('test');
    });
  });

  describe('Error Handling', () => {
    it('should catch thrown errors', () => {
      const throwError = () => {
        throw new Error('Test error');
      };
      expect(throwError).toThrow('Test error');
    });
  });
});

describe('Phase Manager Tests', () => {
  it('should validate phase state structure', () => {
    const mockState = {
      currentPhase: 'planning',
      phases: [
        { id: 'planning', status: 'completed', name: '计划阶段' },
        { id: 'implementation', status: 'in_progress', name: '实施阶段' },
      ],
    };

    expect(mockState.currentPhase).toBeDefined();
    expect(mockState.phases).toBeInstanceOf(Array);
    expect(mockState.phases.length).toBeGreaterThan(0);
  });
});

describe('Command Index Tests', () => {
  it('should validate command structure', () => {
    const mockCommands = [
      { name: 'interview', description: '需求访谈', trigger: '开始访谈' },
      { name: 'plan', description: '任务计划', trigger: '/plan' },
    ];

    expect(mockCommands).toHaveLength(2);
    expect(mockCommands[0]).toHaveProperty('name');
    expect(mockCommands[0]).toHaveProperty('description');
  });
});
