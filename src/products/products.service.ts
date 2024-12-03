import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('ProductsService');

  onModuleInit() {
    this.$connect();
    this.logger.log('Database connected');
  }

  async create(createProductDto: CreateProductDto) {
    await this.product.create({
      data: createProductDto,
    });
    return 'This action adds a new product';
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
    };
    const result = {
      data,
      meta,
      lastPage: lastPage,
    };
    return { result };
  }

  async findOne(id: number) {
    const product = await this.product.findFirst({
      where: { id, available: true },
    });
    if (!product) {
      throw new NotFoundException(`Product not found with id : ${id}`);
    }
    return product;
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
      throw new NotFoundException(`Product not found with id : ${id}`);
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
      throw new NotFoundException(`Product not found with id : ${id}`);
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
      throw new NotFoundException(`Product not found with id : ${id}`);
    }
  }
}
