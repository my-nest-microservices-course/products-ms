import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient, Product } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('ProductsService');

  onModuleInit() {
    this.$connect();
    this.logger.log('Database connected');
  }

  async create(createProductDto: CreateProductDto) {
    try {
      await this.product.create({
        data: createProductDto,
      });
      return 'This action adds a new product';
    } catch (error) {
      this.logger.error(`CREATE_ERROR: ${error.message}`);
      throw new RpcException({
        message: 'PRODUCT_CREATE_ERROR',
        status: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    const totalPages = await this.product.count({
      where: {
        available: true,
      },
    });
    const lastPage = Math.ceil(totalPages / limit);
    const data = await this.product.findMany({
      take: limit,
      skip: (page - 1) * limit,
      where: {
        available: true,
      },
    });
    const meta = {
      total: totalPages,
      page: page,
      lastPage: lastPage,
    };
    const result = {
      data,
      metadata: meta,
    };
    return { result };
  }

  async findOne(id: number) {
    try {
      const product = await this.product.findFirst({
        where: { id, available: true },
      });
      if (!product) {
        throw new RpcException({
          message: `PRODUCT_NOT_FOUND_ID: ${id}`,
          status: HttpStatus.NOT_FOUND,
        });
      }
      return product;
    } catch (error) {
      this.logger.error(`FIND_ONE_ERROR_ID: ${id}`);
      throw new RpcException({
        message: `PRODUCT_NOT_FOUND_ID : ${id}`,
        status: HttpStatus.NOT_FOUND,
      });
    }
  }

  async update(updateProductDto: UpdateProductDto) {
    const { id, price, name } = updateProductDto;
    try {
      return await this.product.update({
        where: { id },
        data: {
          price,
          name,
        },
      });
    } catch (error) {
      this.logger.error(`UPDATE_ERROR_ID: ${id}`);
      throw new RpcException({
        message: `PRODUCT_NOT_FOUND_ID : ${id}`,
        status: HttpStatus.NOT_FOUND,
      });
    }
  }

  async remove(id: number) {
    try {
      return await this.product.update({
        where: { id },
        data: {
          available: false,
        },
      });
    } catch (error) {
      this.logger.error(`REMOVE_ERROR_ID: ${id}`);
      throw new RpcException({
        message: `PRODUCT_NOT_FOUND_ID : ${id}`,
        status: HttpStatus.NOT_FOUND,
      });
    }
  }

  // It's recommended to don't delete records in microservices because can cause data loss in other microservices by references
  // apply a soft delete
  async hardRemove(id: number) {
    try {
      return this.product.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`HARD_REMOVE_ERROR_ID: ${id}`);
      throw new RpcException({
        message: `PRODUCT_NOT_FOUND_ID : ${id}`,
        status: HttpStatus.NOT_FOUND,
      });
    }
  }
  async validateProducts(ids: number[]): Promise<Product[]> {
    try {
      const products = await this.product.findMany({
        where: {
          id: {
            in: ids,
          },
        },
      });
      if (products.length !== ids.length) {
        this.logger.error(`SOME_PRODUCTS_NOT_FOUND`);
        throw new RpcException({
          message: 'SOME_PRODUCTS_NOT_FOUND',
          status: HttpStatus.NOT_FOUND,
        });
      }
      return products;
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      this.logger.error(`ERROR_VALIDATING_PRODUCTS: ${error.message}`);
      throw new RpcException({
        message: 'ERROR_VALIDATING_PRODUCTS',
        status: HttpStatus.BAD_REQUEST,
      });
    }
  }
}
